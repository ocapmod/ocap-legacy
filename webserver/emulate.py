import json
import requests

import config

def send_import(capture_id):
	payload = json.load(open('emulate.json'))
	payload[capture_id] = capture_id
	send_request('import', payload)

def send_request(command, payload):
	try:
		r = requests.post('http://localhost:{}/{}'.format(config.PORT, command), json=payload)
		print('REMOTE: {}'.format(r.text))
	except requests.RequestException as error:
		print(error)

try:
	setup_ran = False
	while True:
		if not setup_ran:
			capture_id = input('Enter id for capture you wish to '
					'emulate (leave blank for default): ')
			setup_ran = True
			print('Options:')
			print('  0: Start again')
			print('  1: Send import')

		opt = input('Enter option: ')
		if opt == '0':
			setup_ran = False
		elif opt == '1':
			if not capture_id:
				capture_id = 'Test Server'
			send_import(capture_id)
		else:
			print('Invalid option')
except KeyboardInterrupt:
	exit()