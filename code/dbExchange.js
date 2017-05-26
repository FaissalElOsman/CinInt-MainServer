var pg 		= require('pg');
var tools 	= require('./tools.js');

const connectionString = process.env.DATABASE_URL || tools.dataBaseLink;

function dropAllTables() {
	pg.connect(connectionString, function(err, client, done) {
		client.query('delete from Film', function(err, result) {
			tools.util.log('LOG INFO - dbExchange.js : Film table is droped');
			done();
		});
	});
	pg.connect(connectionString, function(err, client, done) {
		client.query('delete from Room', function(err, result) {
			tools.util.log('LOG INFO - dbExchange.js : Room table is droped');
			done();
		});
	});
	pg.connect(connectionString, function(err, client, done) {
		client.query('delete from Scheduling', function(err, result) {
			tools.util.log('LOG INFO - dbExchange.js : Scheduling table is droped');
			done();
		});
	});
}

function addFilmTableToDB() {
	pg.connect(connectionString, function(err, client, done) {
		client.query(	'create table if not exists film 	('	+
						'name					varchar(40) ,'	+
						'duration_hour			integer 	,'	+
						'duration_minute		integer 	,'	+
						'description 			text		,'	+
						'initial_language  		varchar(20)	,'	+
						'translated_language	varchar(20) ,'	+
						'id 					serial		 '	+
						');', function(err, result) {
			tools.util.log('LOG INFO - dbExchange.js : Film table is added');
			done();
		});
	});
}

function addRoomTableToDB() {
	pg.connect(connectionString, function(err, client, done) {
		client.query(	'create table if not exists room 	('	+
						'room_num				integer 	,'	+
						'ip_addr				varchar(20) ,'	+
						'id 					serial	 	 '	+
						');', function(err, result) {
			tools.util.log('LOG INFO - dbExchange.js : Room table is added');
			done();
		});
	});
}

function addSchedulingTableToDB() {
	pg.connect(connectionString, function(err, client, done) {
		client.query(	'create table if not exists scheduling ('	+
						'day_week				integer 	,'	+
						'time_hour				integer 	,'	+
						'time_minute			integer 	,'	+
						'id_film				integer 	,'	+
						'id_room				integer 	,'	+
						'id 					serial	 	'	+
						');', function(err, result) {
			tools.util.log('LOG INFO - dbExchange.js : Scheduling table is added');
			done();
		});
	});
}

function insertFilm(parameter,res) {
	var name				= parameter.name;
	var duration_hour		= parameter.duration_hour;
	var duration_minute		= parameter.duration_minute;
	var description			= parameter.description;
	var initial_language	= parameter.initial_language;
	var translated_language	= parameter.translated_language;

	pg.connect(connectionString, function(err, client, done) {
		client.query('insert into Film values ($1,$2,$3,$4,$5,$6);',[name,duration_hour,duration_minute,description,initial_language,translated_language], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error in adding '+ name+' film');
				res.status(500).json({"success": false});
			} else{ 
				tools.util.log('LOG INFO - dbExchange.js : ' + name + ' film is added correctly');
				res.status(200).json({"success": true});
			}
		});
	});
}

function insertRoom(parameter,res) {
	var room_num	= parameter.room_num;
	var ip_addr		= parameter.ip_addr;

	pg.connect(connectionString, function(err, client, done) {
		client.query('insert into room values ($1,$2);',[room_num,ip_addr], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error in adding room number '+ room_num);
				res.status(500).json({"success": false});
			} else{ 
				tools.util.log('LOG INFO - dbExchange.js : Room number '+room_num+' is added correctly');
				res.status(200).json({"success": true}); 
			}
		});
	});
}

function insertSchedule(parameter,res) {
	var day_week	= parameter.day_week;
	var time_hour	= parameter.time_hour;
	var time_minute	= parameter.time_minute;
	var room_num	= parameter.room_num;
	var film_name	= parameter.film_name;
	var film_id		= parameter.film_id;
	var room_id		= parameter.room_id;

	pg.connect(connectionString, function(err, client, done) {
		client.query('insert into scheduling values ($1,$2,$3,$4,$5);',[day_week,time_hour,time_minute,film_id,room_id], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error in scheduling the projection of the film '+ film_name+' in room number '+room_num+' on '+day_week+' at '+time_hour+':'+time_minute);
				res.status(500).json({"success": false});
			} else{ 
				tools.util.log('LOG INFO - dbExchange.js : The projection of the film '+ film_name+' in room number '+room_num+' is scheduled on '+tools.daysOfTheWeek[day_week]+' at '+time_hour+':'+time_minute);
				res.status(200).json({"success": true}); 
			}
		});
	});
}

function deleteFilm(parameter,res,callback) {
	var film_id		= parameter.film_id;
	var film_name	= parameter.film_name;

	pg.connect(connectionString, function(err, client, done) {
		client.query('delete from film where id=$1',[film_id], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when performing deleteFilm request for the film '+ film_name);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : '+film_name+' film is removed from the film table');
				callback(parameter);
			}
		});
	});
}

function deleteRoom(parameter,res,callback) {
	var room_id		= parameter.room_id;
	var room_num	= parameter.room_num;

	pg.connect(connectionString, function(err, client, done) {
		client.query('delete from room where id=$1',[room_id], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when performing deleteRoom request for the room number '+ room_num);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : Room number '+room_num+' is removed from the room table');
				callback(parameter);
			}
		});
	});
}

function deleteSchedule(parameter,res,callback) {
	var day_week		= parameter.day;
	var time_hour 		= parameter.hour;
	var time_minute 	= parameter.minute;
	var id_film 		= parameter.film_id;
	var id_room 		= parameter.room_id;

	pg.connect(connectionString, function(err, client, done) {
		client.query(`delete from scheduling 
						where (day_week=$1)and(time_hour=$2)and(time_minute=$3)and(id_film=$4)and(id_room=$5)`,[day_week,time_hour,time_minute,id_film,id_room], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when performing deleteSchedule request');
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : Requested schedule is removed from the room table');
				res.status(200).json({"success": true});
			}
		});
	});
}

function deleteScheduleForASpecificFilm(parameter,res) {
	var film_id		= parameter.film_id;
	var film_name	= parameter.film_name;

	pg.connect(connectionString, function(err, client, done) {
		client.query('delete from scheduling where id_film=$1',[film_id], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when removing depdencies from scheduling table for the film '+ film_name);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : Dependencies in the scheduling table of the '+film_name+' film are successfully removed');
				res.status(200).json({"success": true}); 
			}
		});
	});
}

function deleteScheduleForASpecificRoom(parameter,res) {
	var room_id		= parameter.room_id;
	var room_num	= parameter.room_num;

	pg.connect(connectionString, function(err, client, done) {
		client.query('delete from scheduling where id_room=$1',[room_id], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when removing depdencies from scheduling table for the room number '+ room_num);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : Dependencies in the scheduling table of the room number '+room_num+' are successfully removed');
				res.status(200).json({"success": true}); 
			}
		});
	});
}

function getIdFilm(parameter,res,callback) {
	var film_name	= parameter.film_name;

	pg.connect(connectionString, function(err, client, done) {
		client.query('select * from film where name=$1',[film_name], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when performing getIdFilm request for the film '+ film_name);
				res.status(500).json({"success": false});
			} else{
				if(result.rows.length===0){
					tools.util.log('LOG WARN - dbExchange.js : '+ film_name+' film does not exist');
					res.status(200).json({"success": false, "data": "Film does not exist"});
				}
				else{
					tools.util.log('LOG INFO - dbExchange.js : '+ film_name+' film is found, its Id is ' + result.rows[0].id);
					parameter.film_id 			= result.rows[0].id;
					parameter.duration_hour		= result.rows[0].duration_hour;
					parameter.duration_minute	= result.rows[0].duration_minute;
					callback(parameter);
				}
			}
		});
	});
}

function getIdRoom(parameter,res,callback) {
	var room_num	= parameter.room_num;

	pg.connect(connectionString, function(err, client, done) {
		client.query('select * from room where room_num=$1',[room_num], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when performing getIdRoom request for the room number '+ room_num);
				res.status(500).json({"success": false});
			} else{
				if(result.rows.length===0){
					tools.util.log('LOG WARN - dbExchange.js : Room number '+ room_num+' does not exist');
					res.status(200).json({"success": false, "data": "Room does not exist"});
				}
				else{
					tools.util.log('LOG INFO - dbExchange.js : Room number '+ room_num+' is found, its Id is ' + result.rows[0].id);
					parameter.room_id = result.rows[0].id;
					callback(parameter);
				}
			}
		});
	});
}

function getTableFilm(res) {
	pg.connect(connectionString, function(err, client, done) {
		client.query('select * from film', function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when processing getTableFilm request');
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : getTableFilm request is processed correctly');
					res.status(200).json({"success": true, "data": result.rows});
			}
		});
	});
}

function getTableRoom(res) {
	pg.connect(connectionString, function(err, client, done) {
		client.query('select * from room', function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when processing getTableRoom request');
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : getTableRoom request is processed correctly');
					res.status(200).json({"success": true, "data": result.rows});
			}
		});
	});
}

function getTableSchedule(res) {
	pg.connect(connectionString, function(err, client, done) {
		client.query(`select * from scheduling`, function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when processing getTableSchedule request for '+tools.daysOfTheWeek[parameter]);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : getTableSchedule request is processed correctly');
					res.status(200).json({"success": true, "data": result.rows});
			}
		});
	});
}

function getTableScheduleForASpecificDay(parameter,res) {
	pg.connect(connectionString, function(err, client, done) {
		client.query(`select s.time_hour, s.time_minute, r.room_num,f.name
					  from scheduling s, room r, film f
					  where (s.id_film=f.id)and(s.id_room=r.id)and(s.day_week=$1)`,[parameter], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when processing getTableScheduleForASpecificDate request for '+tools.daysOfTheWeek[parameter]);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : getTableScheduleForASpecificDate request is processed correctly');
					res.status(200).json({"success": true, "data": result.rows});
			}
		});
	});
}

function getTableScheduleForASpecificRoom(parameter,res) {
	pg.connect(connectionString, function(err, client, done) {
		client.query(`select s.time_hour, s.time_minute, r.room_num,f.name
					  from scheduling s, room r, film f
					  where (s.id_film=f.id)and(s.id_room=r.id)and(r.room_num=$1)`,[parameter], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when processing getTableScheduleForASpecificRoom request for the room number '+parameter);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : getTableScheduleForASpecificRoom request is processed correctly');
					res.status(200).json({"success": true, "data": result.rows});
			}
		});
	});
}

function getTableScheduleForASpecificRoomAndDay(parameter,res,callback) {
	pg.connect(connectionString, function(err, client, done) {
		client.query(`select s.id, s.time_hour, s.time_minute, f.duration_hour, f.duration_minute
					  from scheduling s, room r, film f
					  where (s.id_film=f.id)and(s.id_room=r.id)and(r.room_num=$1)and(s.day_week=$2)`,[parameter.room_num,parameter.day_week], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when processing getTableScheduleForASpecificRoomAndDay request for the room number '+parameter);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : getTableScheduleForASpecificRoom request is processed correctly');
				parameter.data = result.rows;
				callback(parameter);
			}
		});
	});
}

function getIpAdress(parameter,callback){
	pg.connect(connectionString, function(err, client, done) {
		client.query(`select ip_addr from room where room_num=$1`,[parameter.room_num], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when fetching the IP address of the room number '+parameter.room_num);
				res.status(500).json({"success": false});
			} else{
				tools.util.log('LOG INFO - dbExchange.js : The IP address of the room number '+parameter.room_num+' is '+result.rows[0].ip_addr);
					callback(result.rows[0].ip_addr,parameter.object);
			}
		});
	});
}

function doesThisElementExistInFilmTable(parameter,res,callback){
	var film_name	= parameter.name;

	pg.connect(connectionString, function(err, client, done) {
		client.query('select * from film where name=$1',[film_name], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when performing doesThisElementExistInFilmTable request for the film '+ film_name);
				res.status(500).json({"success": false});
			} else{
				if(result.rows.length===0){
					tools.util.log('LOG INFO - dbExchange.js : '+ film_name+' film is not found');
					parameter.doesFilmAlreadyExist=false;
					callback(parameter);
				}
				else{
					tools.util.log('LOG WARN - dbExchange.js : '+ film_name+' film already exists');
					parameter.doesFilmAlreadyExist=true;
					res.status(200).json({"success": false, "data": "Film already exists'"});
				}
			}
		});
	});
}

function doesThisElementExistInRoomTable(parameter,res,callback){
	var room_num	= parameter.room_num;

	pg.connect(connectionString, function(err, client, done) {
		client.query('select * from room where room_num=$1',[room_num], function(err, result) {
			done();
			if (err) {
				tools.util.log('LOG EROR - dbExchange.js : There is an error when performing doesThisElementExistInRoomTable request for the room number '+ room_num);
				res.status(500).json({"success": false});
			} else{
				if(result.rows.length===0){
					tools.util.log('LOG INFO - dbExchange.js : Room number '+ room_num+' is not found');
					callback(parameter);
				}
				else{
					tools.util.log('LOG WARN - dbExchange.js : Room number '+ room_num+' already exists');
					res.status(200).json({"success": false, "data": "Room already exists'"});
				}
			}
		});
	});
}
module.exports={
	addTablesToDB:function(){
		addFilmTableToDB();
		addRoomTableToDB();
		addSchedulingTableToDB();
	},
	dropAllTables,
	insert:function(type,parameter,res){
		switch(type) {
			case tools.requestType.FILM:
			insertFilm(parameter,res);
			break;
			case tools.requestType.ROOM:
			insertRoom(parameter,res);
			break;
			case tools.requestType.SCHEDULE:
			insertSchedule(parameter,res);
			break;
			default:
		} 
	},
	delete:function(type,parameter,res,callback){
		switch(type) {
			case tools.requestType.FILM:
			deleteFilm(parameter,res,callback);
			break;
			case tools.requestType.ROOM:
			deleteRoom(parameter,res,callback);
			break;
			case tools.requestType.SCHEDULE:
			deleteSchedule(parameter,res);
			break;
			case tools.requestType.SCHEDULE + tools.requestType.FILM:
			deleteScheduleForASpecificFilm(parameter,res);
			break;
			case tools.requestType.SCHEDULE + tools.requestType.ROOM:
			deleteScheduleForASpecificRoom(parameter,res);
			break;
			default:
		} 
	},
	getId:function(type,parameter,res,callback){
		switch(type) {
			case tools.requestType.FILM:
			getIdFilm(parameter,res,callback);
			break;
			case tools.requestType.ROOM:
			getIdRoom(parameter,res,callback);
			break;
			default:
		}
	},
	getTable:function(type,parameter,res,callback){
		switch(type) {
			case tools.requestType.FILM:
			getTableFilm(res);
			break;
			case tools.requestType.ROOM:
			getTableRoom(res);
			break;
			case tools.requestType.SCHEDULE:
			getTableSchedule(res);
			break;
			case tools.requestType.SCHEDULE + tools.requestType.FILM:
			getTableScheduleForASpecificDay(parameter,res);
			break;
			case tools.requestType.SCHEDULE + tools.requestType.ROOM:
			getTableScheduleForASpecificRoom(parameter,res);
			break;
			case tools.requestType.SCHEDULE + tools.requestType.SCHEDULE :
			getTableScheduleForASpecificRoomAndDay(parameter,res,callback);
			break;
			default:
		} 
	},
	doesThisElementExist:function(type,parameter,res,callback){
		switch(type) {
			case tools.requestType.FILM:
			doesThisElementExistInFilmTable(parameter,res,callback);
			break;
			case tools.requestType.ROOM:
			doesThisElementExistInRoomTable(parameter,res,callback);
			break;
			default:
		} 
	},
	getIpAdress
};