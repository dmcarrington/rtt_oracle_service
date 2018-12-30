/*https://api.rtt.io/api/v1/json/service/P83002/2018/12/05
https://api.rtt.io/api/v1/json/service/P83020/2018/12/05
Username: rttapi_david.carrington
Password: 

https://username:password@endpoint

*/
require("dotenv").config();
const https = require('https');
const http = require('http');
import { updateDelay } from "./ethereum";

'use strict';
var request = require('request');

function getJson(url){
    return new Promise(function(resolve, reject) {
        request.get({
            url: url,
            json: true,
            headers: {'User-Agent': 'request'}
        }, (err, res, data) => {
            if (err) {
            console.log('Error:', err);
            reject(err);
            } else if (res.statusCode !== 200) {
            console.log('Status:', res.statusCode);
            reject(res);
            } else {
            // data is already parsed as JSON:
            //console.log(data);
            resolve(data);
            }
        });
    });
}

const getLateness = (origin, destination, data) => {
    return new Promise((resolve, reject) => {
        let haveOrigin = false;
        let haveDestination = false;
        let lateness;
        try {
            for(ii = 0; ii < data.locations.length; ii++){
                if(data.locations[ii].crs === origin) {
                    haveOrigin = true;
                    const time = data.locations[ii].realtimeDeparture;
                    const lateness = data.locations[ii].realtimeGbttDepartureLateness;
                    console.log("Departed " + origin + " at " + time + " (" + lateness + ") mins late");
                } else if(data.locations[ii].crs === destination) {
                    haveDestination = true;
                    const time = data.locations[ii].realtimeArrival;
                    const dest_lateness = data.locations[ii].realtimeGbttArrivalLateness;
                    console.log("Arrived " + destination + " at " + time + " (" + dest_lateness + ") mins late");
                    lateness = dest_lateness;
                }
            }
            if(haveOrigin == false) {
                console.log("Origin station " + origin + " not present!");
            }
            if(haveDestination == false) {
                console.log("Destination station " + destination + " not present!");
            }
        } catch(error) {
            reject(error);
            return;
        }
        resolve(lateness);
    });
};

const categoriseDelay = (minsLate) => {
    return new Promise((resolve, reject) => {
        let category;
        try {
            if(minsLate < 15) {
                category = 0;
            } else if (minsLate >= 15 && minsLate < 30) {
                category = 1;
            } else if (minsLate >= 30 && minsLate < 60) {
                category = 2;
            } else if (minsLate >= 60 && minsLate < 120) {
                category = 3;
            } else {
                category = 4;
            }
        } catch (error) {
            reject(error);
            return;
        }
        resolve (category);
    });
}

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

const dailyLateness = (homeStn, workStn) => {
    return new Promise((resolve, reject) => {
        let outboundCategory, returnCategory;
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).pad(2);
            const day = (date.getDate()).pad(2);
            var train1 = "https://" + process.env.API_USERNAME + ':' + process.env.API_PASSWORD + "@api.rtt.io/api/v1/json/service/" + process.env.OUTBOUND_TRAIN + "/"+year+"/"+month+"/"+day;
            console.log(train1);
            var train2 = "https://" + process.env.API_USERNAME + ':' + process.env.API_PASSWORD + "@api.rtt.io/api/v1/json/service/" + process.env.RETURN_TRAIN + "/"+year.toString()+"/"+month.toString()+"/"+day.toString();

            getJson(train1).then(function(data){
                getLateness(homeStn, workStn, data).then(function(minsLate){
                    categoriseDelay(minsLate).then(function(category){
                        outboundCategory = category;
                    });
                }).catch(function(fail){
                    console.log(fail);
                });
                
            });
            
            getJson(train2).then(function(data){
                getLateness(workStn, homeStn, data).then(function(minsLate){
                    categoriseDelay(minsLate).then(function(category){
                        returnCategory = category;
                        console.log("category = ", category);
                    });
                }).catch(function(fail){
                    console.log(fail);
                });
                
            });
        } catch (error) {
            reject(error);
            return;
        }
        resolve({outboundCategory, returnCategory});
    });
};

const main = () => {
    return new Promise((resolve, reject) => {
        try {
            dailyLateness(process.env.HOME_STN, process.env.WORK_STN).then(function(outbout, rtn){
                console.log("aaa");
                console.log(outbout, rtn);
            }).catch(function(fail) {
                console.log(fail);
            });
        }catch(error) {
            reject(error);
            return;
        }
        resolve();
    });
}

main();
