"use strict";
var util  								= require('util');
var dataBaseLink 						= 'postgres://localhost:5432/CinInt';
var requestType 						= {FILM:1, ROOM:2, SCHEDULE:3};
var daysOfTheWeek 						= ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
var minimalDelayBetweenFilms		 	= { "hour"		: 0	, "minute"	: 15};

var schedulerTable    					= [];
var delayBetweenLoadingAndLaunchingMin 	= 10;

function isAValidTime(time) {
	if((time.hour<24)&&(time.hour>-1)&&(time.minute>-1)&&(time.minute<60))
		return true;
	return false;
}

function addTime(timeA,timeB){
	var result	=	{	"sucess"	: 	false					,
					 	"time"		: 	{	
					 						"day"	: 	0	,
					 						"hour"	: 	0	,
					 						"minute": 	0	
					 					}
					}

	if(!isAValidTime(timeA)||!isAValidTime(timeB))
		return result;

	var	minuteSumIsBiggerThan60 		= 	Math.floor((timeA.minute + timeB.minute)/60);
	var minuteSumModulo60				= 	(timeA.minute+timeB.minute)%60;
	var	hourSumIsBiggerThan24			= 	Math.floor((timeA.hour+timeB.hour+minuteSumIsBiggerThan60)/24);
	var hourSumModulo24					= 	(timeA.hour+timeB.hour+minuteSumIsBiggerThan60)%24;

	result.sucess						=	true;
	result.time.day 					=	hourSumIsBiggerThan24;
	result.time.hour 					=	hourSumModulo24;
	result.time.minute 					=	minuteSumModulo60;
										
	return result;
}

function isTimeAOlderThanTimeB(timeA,timeB){
	if(!isAValidTime(timeA)||!isAValidTime(timeB))
		return false;

	if(timeA.day 	 > 	timeB.day		)	return false;
	if(timeA.day 	 < 	timeB.day	 	)	return true;
	if(timeA.hour 	 > 	timeB.hour		)	return false;
	if(timeA.hour 	 < 	timeB.hour 		)	return true;
	if(timeA.minute  > 	timeB.minute	)	return false;
	if(timeA.minute  < 	timeB.minute	)	return true;

	return false;
}

function sortTimeTable(data){
	var initialLength 					=	data.length ;
	var tmpData							= 	[];

	while(initialLength > 0){
		var indexOfMinimalValue 		= 	0;
		var minimalValue 				= 	{"hour" : 23, "minute" : 59};

		for (var i = 0; i < initialLength; i++){
			if(isTimeAOlderThanTimeB(data[i].time,minimalValue)){
				minimalValue.hour 		= 	data[i].time.hour;
				minimalValue.minute 	= 	data[i].time.minute;
				indexOfMinimalValue		= 	i;
			}
		}
		tmpData[tmpData.length]			=	data[indexOfMinimalValue];
		data.splice(indexOfMinimalValue,1);
		initialLength--;
	}

	tmpData.forEach(function(time){
		data.push(time);
	});
}

function canTimeXFitInDataTable(timeX,DelayAddedToA,data){
	var indexOfMinimal 			=	0;
	var currentTimeConstraint 	= 	true;
	var	previousTimeConstraint 	= 	true;

	if(data.length==0)	return true;

	sortTimeTable(data);

	for (var i = 0; i < data.length; i++){
		if(isTimeAOlderThanTimeB(data[i].time,timeX.time))	indexOfMinimal++;
		else break;
	}

	if(indexOfMinimal<data.length)
		currentTimeConstraint = isTimeAOlderThanTimeB(addTime(addTime(timeX.time,timeX.duration).time,DelayAddedToA).time,data[indexOfMinimal].time);
		
	if(indexOfMinimal>0)
		previousTimeConstraint = isTimeAOlderThanTimeB(addTime(addTime(data[indexOfMinimal-1].time,data[indexOfMinimal-1].duration).time,DelayAddedToA).time,timeX.time);
		
	return previousTimeConstraint && currentTimeConstraint;
}

function toBuffer(file){
	var buffer = new Buffer(file.byteLength);
	var view = new Unit8Array(file);
	for(var i = 0;i < buffer.length; ++i)
		buffer[i] = view[i];
	return buffer;
}

module.exports={
	util,
	requestType,
	dataBaseLink,
	isAValidTime,
	addTime,
	isTimeAOlderThanTimeB,
	canTimeXFitInDataTable,
	daysOfTheWeek,
	sortTimeTable,
	minimalDelayBetweenFilms,
	toBuffer,
	schedulerTable,
	delayBetweenLoadingAndLaunchingMin
};