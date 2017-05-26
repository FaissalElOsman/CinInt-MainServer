import unittest
import json
import unirest
import datetime
import filecmp
import socket
import os
import threading
from http_parser.parser import HttpParser

from data import data

SERVER_URL="http://127.0.0.1:5100/"

data_dumped			= json.dumps(data) 
data_in_json_format = json.loads(data_dumped)

class SyncNodeServerSimulator:
    def __init__(self,isReceivedRequestMatchExpectation):
        self.isReceivedRequestMatchExpectation = isReceivedRequestMatchExpectation

    def handler(self):
        httpParser1 = HttpParser()
        httpParser2 = HttpParser()
        serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        serverSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        serverSocket.bind(('', 5000))
        serverSocket.listen(1)
        conn, addr = serverSocket.accept()
        cumulatedPacketLength = 0
        while 1:
            data = conn.recv(1024)
            receivedPacketLength = len(data)
            httpParser1.execute(data, receivedPacketLength)
            print httpParser1.get_method()
            cumulatedPacketLength += receivedPacketLength
            if cumulatedPacketLength > 235:
                self.isReceivedRequestMatchExpectation = True
                response_body_raw = '{"success":true,"data":"FILE_FOUND_AND_LOADED"}'
                conn.send('%s %s %s\r\n%s: %s\r\n%s: %s\r\n\r\n%s' % (  'HTTP/1.1', '200', 'OK',\
                                                                        'Content-Type','application/json; charset=utf-8',\
                                                                        'Content-Length',len(response_body_raw),\
                                                                        response_body_raw))
                conn.close()
            break

        serverSocket.listen(1)
        conn, addr = serverSocket.accept()
        cumulatedPacketLength = 0
        while 1:
            data = conn.recv(1024)
            receivedPacketLength = len(data)
            httpParser2.execute(data, receivedPacketLength)
            print httpParser2.get_method()
            cumulatedPacketLength += receivedPacketLength
            if cumulatedPacketLength > 235:
                self.isReceivedRequestMatchExpectation = True
                response_body_raw = '{"success":true,"data":"FILE_FOUND_AND_LOADED"}'
                conn.send('%s %s %s\r\n%s: %s\r\n%s: %s\r\n\r\n%s' % (  'HTTP/1.1', '200', 'OK',\
                                                                        'Content-Type','application/json; charset=utf-8',\
                                                                        'Content-Length',len(response_body_raw),\
                                                                        response_body_raw))
                conn.close()
                serverSocket.close()
            break

    def start(self):
        self.sNSS = threading.Thread(name='syncNodeServerSimulator1', target=self.handler, args=())
        self.sNSS.start()
    
    def join(self):
        self.sNSS.join()

class TestStringMethods(unittest.TestCase):

    def test_add_film_normal(self):
        sucess=1
        for film in data_in_json_format['film']:
            film_name = "_".join( film['name'].split() )
            film_name += "_"

            res=unirest.post(SERVER_URL+'addFilm', headers={"Accept": "application/json"},
                params={
                "parameter":    '{  "name": "'  +       film['name']                + 
                '" , "duration_hour": '         + str(  film['duration_hour'])      +
                ' , "duration_minute": '        + str(  film['duration_minute'])    +
                ' , "description": "'           +       film['description']         +
                '" , "initial_language": "'     +       film['initial_language']    +
                '" , "translated_language": "'  +       film['translated_language'] + '"}',
                "file": open("files/"+film_name+film['initial_language'], mode="r")
                })
            tmp = {}
            tmp_res = json.loads(res.raw_body)
            sucess=sucess&(tmp_res['success']==True)
        self.assertEqual(sucess, 1)

    def test_add_film_already_added(self):
        sucess=1
        film = data_in_json_format['film'][0]
        film_name = "_".join( film['name'].split() )
        film_name += "_"

        res=unirest.post(SERVER_URL+'addFilm', headers={"Accept": "application/json"},
            params={
            "parameter":    '{  "name": "'      +       film['name']                + 
            '" , "duration_hour": '             + str(  film['duration_hour'])      +
            ' , "duration_minute": '            + str(  film['duration_minute'])    +
            ' , "description": "'               +       film['description']         +
            '" , "initial_language": "'         +       film['initial_language']    +
            '" , "translated_language": "'      +       film['translated_language'] + '"}',
            "file": open("files/"+film_name+film['initial_language'], mode="r")
            })
        tmp = {}
        tmp_res = json.loads(res.raw_body)
        sucess=sucess&(tmp_res['success']==False)
        self.assertEqual(sucess, 1)

    def test_add_room_normal(self):
        sucess=1
        for room in data_in_json_format['room']:
            res=unirest.post(SERVER_URL+'addRoom', headers={ "Content-Type": "application/json" }, params=json.dumps({
                "room_num"     : room['room_num'],
                "ip_addr"      : room['ip_addr']
                }))
            tmp = {}
            tmp_res = json.loads(res.raw_body)
            sucess=sucess&(tmp_res['success']==True)
        self.assertEqual(sucess, 1)

    def test_add_room_already_added(self):
        sucess=1
        room = data_in_json_format['room'][0]
        res=unirest.post(SERVER_URL+'addRoom', headers={ "Content-Type": "application/json" }, params=json.dumps({
            "room_num"     : room['room_num'],
            "ip_addr"      : room['ip_addr']
            }))
        tmp = {}
        tmp_res = json.loads(res.raw_body)
        sucess = tmp_res['success']==False
        self.assertEqual(sucess, 1)

    def test_add_scheduling_normal(self):
        sucess=1
        i = 0
        for scheduling in data_in_json_format['scheduling']:
            if(i > 1):
                res=unirest.post(SERVER_URL+'addScheduling', headers={ "Content-Type": "application/json" }, params=json.dumps({
                    "day_week"     : scheduling['day_week'],
                    "time_hour"    : scheduling['time_hour'],
                    "time_minute"  : scheduling['time_minute'],
                    "room_num"     : scheduling['room_num'],
                    "film_name"    : scheduling['film_name']
                    }))
                tmp = {}
                tmp_res = json.loads(res.raw_body)
                sucess=sucess&(tmp_res['success']==True)
            else:
                i+=1
        self.assertEqual(sucess, 1)

    def test_add_scheduling_film_not_found(self):
        sucess=1
        scheduling = data_in_json_format['scheduling'][0]
        res=unirest.post(SERVER_URL+'addScheduling', headers={ "Content-Type": "application/json" }, params=json.dumps({
            "day_week"     : scheduling['day_week'],
            "time_hour"    : scheduling['time_hour'],
            "time_minute"  : scheduling['time_minute'],
            "room_num"     : scheduling['room_num'],
            "film_name"    : scheduling['film_name']
            }))
        tmp = {}
        tmp_res = json.loads(res.raw_body)
        sucess=(tmp_res['success']==False)
        self.assertEqual(sucess, 1)

    def test_add_scheduling_room_not_found(self):
        sucess=1
        scheduling = data_in_json_format['scheduling'][1]
        res=unirest.post(SERVER_URL+'addScheduling', headers={ "Content-Type": "application/json" }, params=json.dumps({
            "day_week"     : scheduling['day_week'],
            "time_hour"    : scheduling['time_hour'],
            "time_minute"  : scheduling['time_minute'],
            "room_num"     : scheduling['room_num'],
            "film_name"    : scheduling['film_name']
            }))
        tmp = {}
        tmp_res = json.loads(res.raw_body)
        sucess=(tmp_res['success']==False)
        self.assertEqual(sucess, 1)

    def test_get_films(self):
        sucess=1
        res=unirest.get(SERVER_URL+'getFilms', headers={"Accept": "application/json"},params={})
        tmp = {}
        tmp_res = json.loads(res.raw_body)
        index = 0;
        for film in data_in_json_format['film']:
            if (film['name']==tmp_res['data'][index]['name']) and (film['duration_hour']==tmp_res['data'][index]['duration_hour']) and (film['duration_minute']==tmp_res['data'][index]['duration_minute']) and (film['description']==tmp_res['data'][index]['description']) and (film['initial_language']==tmp_res['data'][index]['initial_language']) and (film['translated_language']==tmp_res['data'][index]['translated_language']):
                sucess=sucess&(tmp_res['success']==True)
            else:
                sucess=sucess&(tmp_res['success']==False)
            index+=1
        self.assertEqual(sucess, 1)

    def test_get_rooms(self):
        sucess=1
        res=unirest.get(SERVER_URL+'getRooms', headers={"Accept": "application/json"},params={})
        tmp = {}
        tmp_res = json.loads(res.raw_body)
        index = 0;
        for room in data_in_json_format['room']:
            if (room['room_num']==tmp_res['data'][index]['room_num']) and (room['ip_addr']==tmp_res['data'][index]['ip_addr']) :
                sucess=sucess&(tmp_res['success']==True)
            else:
                sucess=sucess&(tmp_res['success']==False)
            index+=1
        self.assertEqual(sucess, 1)

    def test_get_the_scheduling_for_a_specific_day(self):
        sucess = 1
        day = 3
        is_found = False

        res = unirest.get(SERVER_URL+'getTheSchedulingForASpecificDay', headers={"Accept": "application/json"},params={"day": day})
        tmp_res = json.loads(res.raw_body)

        for scheduling in data_in_json_format['scheduling']:
            if(scheduling['day_week'] == day):
                for s in tmp_res['data']:
                    if(s['name'] == scheduling['film_name']):
                        is_found = True

                if(is_found == False):
                    print(scheduling['film_name'])
                    sucess = sucess & False

                is_found = False
        self.assertEqual(sucess, 1)

    def test_get_the_scheduling_for_a_specific_room(self):
        sucess = 1
        room_num = 2
        is_found = False

        res = unirest.get(SERVER_URL+'getTheSchedulingForASpecificRoom', headers={"Accept": "application/json"},params={"room_num": room_num})
        tmp_res = json.loads(res.raw_body)

        for scheduling in data_in_json_format['scheduling']:
            if(scheduling['room_num'] == room_num):
                for s in tmp_res['data']:
                    if(s['name'] == scheduling['film_name']):
                        is_found = True

                if(is_found == False):
                    sucess = sucess & False

                is_found = False
        self.assertEqual(sucess, 1)

    def test_remove_film_normal(self):
        sucess=1
        film_name = "LA LA LAND"
        res=unirest.get(SERVER_URL+'getFilms', headers={"Accept": "application/json"},params={})
        tmp_res = json.loads(res.raw_body)
        id = -1;
        for film in tmp_res['data']:
            if (film['name']==film_name):
                id=film['id']

        if(id==-1):
            sucess=sucess&False
        
        res=unirest.get(SERVER_URL+'removeFilm', headers={}, params={"name": film_name})

        res=unirest.get(SERVER_URL+'getFilms', headers={"Accept": "application/json"},params={})
        tmp_res = json.loads(res.raw_body)
        for film in tmp_res['data']:
            if (film['name']==film_name):
                sucess=sucess&False
            else:
                sucess=sucess&True

        res=unirest.get(SERVER_URL+'getScheduling', headers={"Accept": "application/json"},params={})
        tmp_res = json.loads(res.raw_body)
        for schedule in tmp_res['data']:
            if (schedule['id_film']==id):
                sucess=sucess&False
            else:
                sucess=sucess&True

        self.assertEqual(sucess, 1)

    def test_remove_film_does_not_exist(self):
        sucess=1
        film_name = "FURRY"
        res=unirest.get(SERVER_URL+'removeFilm', headers={}, params={"name": film_name})
        tmp_res = json.loads(res.raw_body)
        self.assertEqual((tmp_res['success']==False), 1)

    def test_remove_room_normal(self):
        sucess=1
        room_num = 5;
        res=unirest.get(SERVER_URL+'removeRoom', headers={}, params={"number": room_num})
        for day in range(0,6):
            res=unirest.get(SERVER_URL+'getTheSchedulingForASpecificDay', headers={}, params={"day": day})
            tmp_res = json.loads(res.raw_body)
            for schedule in tmp_res['data']:
                if(schedule['room_num'] == room_num):
                    sucess = 0
        self.assertEqual(sucess, 1)

    def test_remove_room_does_not_exist(self):
        sucess=1
        room_num = 0;
        res=unirest.get(SERVER_URL+'removeRoom', headers={}, params={"number": room_num})
        tmp_res = json.loads(res.raw_body)
        self.assertEqual((tmp_res['success']==False), 1)
        
    def test_remove_scheduling(self):
        sucess=1
        self.assertEqual(sucess, 1)

    def test_get_qr_code(self):
        sucess=1
        res=unirest.get(SERVER_URL+'getQRCode', headers={}, params={"room_num": 2})
        tmpFile = open("tmpQRcodeOfRoom2", "wb")
        tmpFile.write(res.raw_body)
        tmpFile.close()
        res = filecmp.cmp("tmpQRcodeOfRoom2", "./files/QRcodeOfRoom2")
        os.remove("tmpQRcodeOfRoom2")
        self.assertEqual(res, True)

    def test_scheduler(self):
        sucess=1
        unirest.get('http://127.0.0.1:5100/'+'activateTestMode', headers={"Accept": "application/json"},params={})
        syncNodeServerSimulator = SyncNodeServerSimulator(False)
        syncNodeServerSimulator.start()
        now = datetime.datetime.now()
        after10SecFromNow = now + datetime.timedelta(0,10)
        res = unirest.get(SERVER_URL+'scheduleElement', headers={"Accept": "application/json"},params={"filmName": "Dans le trame","roomNum":6,"day":5,"hour":after10SecFromNow.hour,"minute":after10SecFromNow.minute,"second":after10SecFromNow.second})
        syncNodeServerSimulator.join()
        self.assertEqual(syncNodeServerSimulator.isReceivedRequestMatchExpectation, True)

if __name__ == '__main__':
    suite = unittest.TestSuite()
    suite.addTest(TestStringMethods('test_add_film_normal'))
    suite.addTest(TestStringMethods('test_add_film_already_added'))
    suite.addTest(TestStringMethods('test_add_room_normal'))
    suite.addTest(TestStringMethods('test_add_room_already_added'))
    suite.addTest(TestStringMethods('test_add_scheduling_normal'))
    suite.addTest(TestStringMethods('test_add_scheduling_film_not_found'))
    suite.addTest(TestStringMethods('test_add_scheduling_room_not_found'))
    suite.addTest(TestStringMethods('test_get_films'))
    suite.addTest(TestStringMethods('test_get_rooms'))
    suite.addTest(TestStringMethods('test_get_the_scheduling_for_a_specific_day'))
    suite.addTest(TestStringMethods('test_get_the_scheduling_for_a_specific_room'))
    suite.addTest(TestStringMethods('test_remove_film_normal')) 
    suite.addTest(TestStringMethods('test_remove_film_does_not_exist'))
    suite.addTest(TestStringMethods('test_remove_room_normal'))
    suite.addTest(TestStringMethods('test_remove_room_does_not_exist'))
    suite.addTest(TestStringMethods('test_remove_scheduling'))
    suite.addTest(TestStringMethods('test_get_qr_code'))
    suite.addTest(TestStringMethods('test_scheduler'))
    unittest.TextTestRunner(verbosity=2).run(suite)