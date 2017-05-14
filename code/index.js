var express     	= require('express');
var bodyParser  	= require('body-parser');
var pg          	= require('pg');
var qr 				= require('qr-image');
var formidable 		= require('formidable');
var fs 				= require('fs');
var path 			= require('path');
var request 		= require('request');
var dbExchange		= require('./dbExchange.js');
var tools 			= require('./tools.js');

var app = express();
app.set('port', (process.env.PORT || 5100));
app.use(bodyParser.json());

app.listen(app.get('port'), function() {
	tools.util.log('LOG INFO - index.js : Node app is running on port ' + app.get('port'));
});

/*************************************************************************************
*								 DataBaseManagement 								 *
*************************************************************************************/							

dbExchange.dropAllTables();
tools.util.log('LOG INFO - index.js : Tables (Film, Room, Scheduling) are droped');
dbExchange.addTablesToDB();
tools.util.log('LOG INFO - index.js : Tables (Film, Room, Scheduling) are added');

app.post('/addFilm', function (req, res) {
	var form = new formidable.IncomingForm();
	form.multiples = true;
	form.uploadDir = path.join(__dirname, '/uploads');
	form.parse(req);
	var parameter;
	
	form.on('field', function(name, field) {
		field_in_json_format 	= JSON.parse(field);
		var name          		= field_in_json_format.name;
		var duration_hour 		= field_in_json_format.duration_hour;
		var duration_minute 	= field_in_json_format.duration_minute;
		var description     	= field_in_json_format.description;
		var initial_language 	= field_in_json_format.initial_language;
		var translated_language = field_in_json_format.translated_language;

		tools.util.log('LOG INFO - index.js : Receiving addFilm request for the film '+ name);

		parameter      			=  { 	"name"					: name					,
										"duration_hour"			: duration_hour			,
										"duration_minute"		: duration_minute		,
										"description"			: description			,
										"initial_language"		: initial_language		,
								    	"translated_language"	: translated_language	};

		dbExchange.doesThisElementExist(tools.requestType.FILM,parameter,res, function(parameter){
			dbExchange.insert(tools.requestType.FILM,parameter,res);
		});		
    });

	form.on('file', function(field, file) {
		fs.rename(file.path, path.join(form.uploadDir, file.name.split("/")[1]));
	});	
});

app.post('/addRoom', function (req, res) {
	var room_num         	= req.body.room_num;
	var ip_addr 			= req.body.ip_addr;

	tools.util.log('LOG INFO - index.js : Receiving addRoom request for the room number '+ room_num);

	var parameter      		=  { 	"room_num"				: room_num				,
									"ip_addr"				: ip_addr				};

	dbExchange.doesThisElementExist(tools.requestType.ROOM,parameter,res, function(parameter){
  		dbExchange.insert(tools.requestType.ROOM,parameter,res)
  	});
});

app.post('/addScheduling', function (req, res) {
	var	day_week			= req.body.day_week;
	var time_hour			= req.body.time_hour;
	var time_minute			= req.body.time_minute;
	var room_num         	= req.body.room_num;
	var film_name 			= req.body.film_name;
	var tmp_schedule_tab	= [];
	var	tmp_data			= 	{
        							"id"			: 0		,
        							"time" 			:
        							{
										"day"    	: 0		,
            							"hour"    	: 0		,
            							"minute"  	: 0 	
        							} ,
            						"duration"		: 
            						{
           								"day"    	: 0		,
           								"hour"		: 0		,
           								"minute"  	: 0 	
            						}
        						};

	tools.util.log('LOG INFO - index.js : Receiving addScheduling request for the film ' + film_name + ' projected in the room number ' + room_num + ' on ' + tools.daysOfTheWeek[day_week] + ' at ' + time_hour + ':' + time_minute);

  	var parameter 			= { 	"day_week"				: day_week				,
									"time_hour"				: time_hour				,
									"time_minute"			: time_minute			,
									"room_num"				: room_num				,
									"film_name"				: film_name				,
								    "room_id"				: 0						,
								    "film_id"				: 0						,
								    "duration_hour"			: 0						,
								    "duration_minute"		: 0						,		
									"data"					: 0						};

  	dbExchange.getId(tools.requestType.FILM,parameter,res,function(parameter){
  		dbExchange.getId(tools.requestType.ROOM,parameter,res,function(parameter){
  			dbExchange.getTable(tools.requestType.SCHEDULE + tools.requestType.SCHEDULE,parameter,res,function(parameter){
  				parameter.data.forEach(function(element){
  					tmp_data.id 				= element.id;
  					tmp_data.time.hour 			= element.time_hour;
  					tmp_data.time.minute 		= element.time_minute;
  					tmp_data.duration.hour 		= element.duration_hour;
  					tmp_data.duration.minute 	= element.duration_minute;
  					tmp_schedule_tab.push(tmp_data);
  				});

  					tmp_data.time.hour 			= parameter.time_hour;
  					tmp_data.time.minute 		= parameter.time_minute;
  					tmp_data.duration.hour 		= parameter.duration_hour;
  					tmp_data.duration.minute 	= parameter.duration_minute;

  				if(tools.canTimeXFitInDataTable(tmp_data,tools.minimalDelayBetweenFilms,tmp_schedule_tab)){
  					dbExchange.insert(tools.requestType.SCHEDULE,parameter,res);
  				}
  			});
  		});
  	});
});

app.get('/removeFilm', function (req, res) {
	var query            = require('url').parse(req.url,true).query;
	var film_name		 = query.name;

	tools.util.log('LOG INFO - index.js : Receiving removeFilm request for the film '+ film_name);

	var parameter 			= { 	"film_name"				: film_name				,
								    "film_id"				: 0						,
									"duration_hour"			: 0						,
								    "duration_minute"		: 0						};

	dbExchange.getId(tools.requestType.FILM,parameter,res,function(parameter){
  		dbExchange.delete(tools.requestType.FILM,parameter,res,function(parameter){
  			dbExchange.delete(tools.requestType.SCHEDULE + tools.requestType.FILM,parameter,res,function(parameter){
  				res.status(200).json({"success": true});
  			});
  		});
  	});
});

app.get('/removeRoom', function (req, res) {
	var query            	= require('url').parse(req.url,true).query;
	var room_num		 	= query.number;

	tools.util.log('LOG INFO - index.js : Receiving removeRoom request for the room number '+ room_num);

	var parameter 			= { 	"room_num"				: room_num				,
								    "room_id"				: 0						};

	dbExchange.getId(tools.requestType.ROOM,parameter,res,function(parameter){
  		dbExchange.delete(tools.requestType.ROOM,parameter,res,function(parameter){
  			dbExchange.delete(tools.requestType.SCHEDULE + tools.requestType.ROOM,parameter,res,function(parameter){
  				res.status(200).json({"success": true});
  			});
  		});
  	});
});

/*To be continued*/
app.get('/removeScheduling', function (req, res) {
	var query           = require('url').parse(req.url,true).query;
	var film_name		= query.film_name;
	var room_num 		= query.room_num
	var day 			= query.day;
	var hour 			= query.hour;
	var minute 			= query.minute;

	tools.util.log('LOG INFO - index.js : Receiving removeScheduling request for the film '+ film_name+' which will be projected in the room number '+room_num);

	var parameter 			= { 	"film_name"				: film_name				,
								    "film_id"				: 0						,
								    "room_num"				: room_num				,
								    "room_id"				: 0						,
									"day"					: day 					,
									"hour"					: hour 					,
									"minute"				: minute 				};

	dbExchange.getId(tools.requestType.ROOM,parameter,res,function(parameter){
  		dbExchange.getId(tools.requestType.FILM,parameter,res,function(parameter){
  			dbExchange.delete(tools.requestType.SCHEDULE , parameter,res,function(parameter){
  				res.status(200).json({"success": true});
  			});
  		});
  	});	
});

app.get('/getFilms', function (req, res) {
	tools.util.log('LOG INFO - index.js : Receiving getFilms request ');

  	dbExchange.getTable(tools.requestType.FILM,0,res);
});

app.get('/getRooms', function (req, res) {
	tools.util.log('LOG INFO - index.js : Receiving getRooms request ');

  	dbExchange.getTable(tools.requestType.ROOM,0,res);
});

app.get('/getScheduling', function (req, res) {
	tools.util.log('LOG INFO - index.js : Receiving getTheScheduling request');

  	dbExchange.getTable(tools.requestType.SCHEDULE,0,res);
});

app.get('/getTheSchedulingForASpecificDay', function (req, res) {
	var query            	= require('url').parse(req.url,true).query;
	var day_week		 	= query.day;

	tools.util.log('LOG INFO - index.js : Receiving getTheSchedulingForASpecificDay request for '+tools.daysOfTheWeek[day_week]);

  	dbExchange.getTable(tools.requestType.SCHEDULE + tools.requestType.FILM,day_week,res);
});

app.get('/getTheSchedulingForASpecificRoom', function (req, res) {
	var query            	= require('url').parse(req.url,true).query;
	var room_num		 	= query.room_num;

	var parameter 			= { 	"room_num"				: room_num				,
								    "room_id"				: 0						};
	tools.util.log('LOG INFO - index.js : Receiving getTheSchedulingForASpecificRoom request for the room number'+room_num);
	dbExchange.getId(tools.requestType.ROOM,parameter,res,function(parameter){
  		dbExchange.getTable(tools.requestType.SCHEDULE + tools.requestType.ROOM,room_num,res);
  	});
});

/*************************************************************************************
*								  QRCodeGeneration  								 *
*************************************************************************************/	

app.get('/getQRCode', function (req, res) {
	var query            	= require('url').parse(req.url,true).query;
	var room_num		 	= query.room_num;

	var parameter 			= { 	"room_num"				: room_num				,
								    "room_id"				: 0						};
	tools.util.log('LOG INFO - index.js : Receiving getQRCode request for the room number '+room_num);
	dbExchange.getId(tools.requestType.ROOM,parameter,res,function(parameter){
  		dbExchange.getIpAdress(room_num,function(IpAddress){
  			res.set('Content-Type', 'image/png');
			var qr_svg = qr.image(IpAddress, { type: 'png' });
			qr_svg.pipe(res);
  		});
  	});
});

/*************************************************************************************
*								   FilmScheduling   								 *
*************************************************************************************/	

/*To be continued*/
var currentWeekDay = 1;
app.post('/', function (req, res) {
	var urlSyncNode = "http://127.0.0.1:5000/";
	var reqToSyncNode = request.post(urlSyncNode, function(err,resp,body){
		if(err)
			console.log('Error!');
		else
			console.log('URL: ' + body);
	});
	var form = reqToSyncNode.form();
	form.append('file', tools.toBuffer())
	res.status(200).json({"success": true});
});
/*************************************************************************************
*								  DashboardReendering   							 *
*************************************************************************************/
app.use(express.static(path.join(__dirname, '../../CinInt-AdminWeb/')));