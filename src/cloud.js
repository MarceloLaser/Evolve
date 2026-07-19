import { global } from './vars.js';

// Google Drive cloud save. The save lives in the OAuth client's hidden appDataFolder,
// so it is tied to (Google account x this client ID) and needs no file path or picker.
const cloudClientID = '1097364945027-odv1sf0vfknvt8bftf0eq8tsbh2gkkhv.apps.googleusercontent.com';
const cloudScope = 'https://www.googleapis.com/auth/drive.appdata';
const cloudFileName = 'evolve.save';

let tokenClient = false;
let accessToken = false;
let tokenExpires = 0;

function cloudStatus(msg,err){
    $('#cloudStatus').text(msg);
    $('#cloudStatus').toggleClass('has-text-danger',err ? true : false);
    $('#cloudStatus').toggleClass('has-text-success',err ? false : true);
}

// Access tokens from the GIS token flow last ~1 hour and cannot be silently refreshed
// without this popup-capable call, so tokens are requested lazily per user action
function getToken(){
    return new Promise(function(resolve,reject){
        if (accessToken && Date.now() < tokenExpires - 60000){
            return resolve(accessToken);
        }
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2){
            return reject(new Error('Google sign-in library not loaded; check connection and ad blockers'));
        }
        if (!tokenClient){
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: cloudClientID,
                scope: cloudScope,
                callback: function(){}
            });
        }
        tokenClient.callback = function(resp){
            if (resp.error){
                return reject(new Error(resp.error_description || resp.error));
            }
            accessToken = resp.access_token;
            tokenExpires = Date.now() + (resp.expires_in * 1000);
            resolve(accessToken);
        };
        tokenClient.error_callback = function(resp){
            reject(new Error(resp.message || resp.type || 'sign-in failed'));
        };
        tokenClient.requestAccessToken({ prompt: '' });
    });
}

async function driveFetch(token,url,opts){
    opts = opts || {};
    opts.headers = Object.assign({ Authorization: `Bearer ${token}` }, opts.headers || {});
    let resp = await fetch(url,opts);
    if (!resp.ok){
        if (resp.status === 401){
            accessToken = false;
        }
        throw new Error(`Google Drive request failed (${resp.status}); try again`);
    }
    return resp;
}

async function findCloudSave(token){
    let query = encodeURIComponent(`name='${cloudFileName}'`);
    let resp = await driveFetch(token,`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,modifiedTime,appProperties)`);
    let data = await resp.json();
    return data.files && data.files.length > 0 ? data.files[0] : false;
}

async function uploadCloudSave(token,existing,content){
    let metadata = {
        name: cloudFileName,
        mimeType: 'text/plain',
        appProperties: {
            resets: String(global.stats.reset),
            days: String(global.stats.days)
        }
    };
    if (!existing){
        metadata.parents = ['appDataFolder'];
    }
    const boundary = 'evolve_cloud_save_boundary';
    let body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
        + `--${boundary}\r\nContent-Type: text/plain\r\n\r\n${content}\r\n--${boundary}--`;
    let url = existing
        ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart`
        : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
    await driveFetch(token,url,{
        method: existing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: body
    });
}

export function cloudSave(){
    if (global.race['noexport']){
        return cloudStatus(`Cloud saving is unavailable during ${global.race.noexport} creation`,true);
    }
    cloudStatus('Saving to cloud...');
    getToken().then(async function(token){
        let existing = await findCloudSave(token);
        if (existing && existing.appProperties){
            let cResets = Number(existing.appProperties.resets || 0);
            let cDays = Number(existing.appProperties.days || 0);
            if (cResets > global.stats.reset || (cResets === global.stats.reset && cDays > global.stats.days)){
                if (!window.confirm(`The cloud save looks further progressed than this game (${cResets} resets / day ${cDays} vs ${global.stats.reset} resets / day ${global.stats.days}). Overwrite the cloud save?`)){
                    return cloudStatus('Cloud save cancelled',true);
                }
            }
        }
        await uploadCloudSave(token,existing,window.exportGame());
        cloudStatus(`Saved to cloud at ${new Date().toLocaleTimeString()}`);
    }).catch(function(e){
        cloudStatus(e.message,true);
    });
}

export function cloudLoad(){
    cloudStatus('Checking cloud...');
    getToken().then(async function(token){
        let existing = await findCloudSave(token);
        if (!existing){
            return cloudStatus('No cloud save found for this Google account',true);
        }
        let resp = await driveFetch(token,`https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`);
        let data = await resp.text();
        let valid = false;
        try {
            let state = JSON.parse(LZString.decompressFromBase64(data));
            valid = state && 'evolution' in state && 'stats' in state;
        }
        catch (e){ valid = false; }
        if (!valid){
            return cloudStatus('The cloud file is not a valid save',true);
        }
        let when = existing.modifiedTime ? new Date(existing.modifiedTime).toLocaleString() : 'unknown time';
        if (!window.confirm(`Replace the current game with the cloud save from ${when}? The game will reload.`)){
            return cloudStatus('Cloud load cancelled',true);
        }
        cloudStatus('Loading cloud save...');
        window.importGame(data);
    }).catch(function(e){
        cloudStatus(e.message,true);
    });
}
