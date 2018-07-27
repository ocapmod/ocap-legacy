"""Script for bundling all addon files into one release folder.

Includes option to copy release into local Arma folder.

Files copied into release folder:
	- PBO'd addon
	- Userconfig
	- Extension
"""

import os
import shutil
import subprocess

import config


RELEASE_PATH = 'release'
EXTENSION_FILENAME = 'ocap_exporter_x64.dll'


def copy_release_to_arma():
	if not os.path.isdir(config.ARMA_ROOT_PATH):
		print('Error: The Arma path provided does not exist:')
		print(config.ARMA_ROOT_PATH)
		return

	arma_ocap_path = '{}/@ocap'.format(config.ARMA_ROOT_PATH)

	# Delete old addon
	shutil.rmtree(arma_ocap_path, ignore_errors=True)

	# Delete old userconfig
	shutil.rmtree(
		'{}/userconfig/ocap'.format(config.ARMA_ROOT_PATH),
		ignore_errors=True
	)

	# Copy new addon
	shutil.copytree(
		'{}/@ocap'.format(RELEASE_PATH),
		arma_ocap_path
	)

	# Copy new userconfig
	shutil.copytree(
		'{}/@ocap/userconfig/ocap'.format(RELEASE_PATH),
		'{}/userconfig/ocap'.format(config.ARMA_ROOT_PATH)
	)

	print('Copied release to {}'.format(config.ARMA_ROOT_PATH))


def make_release():
	# Delete previous release
	shutil.rmtree(RELEASE_PATH, ignore_errors=True)

	# Copy addon into release folder
	shutil.copytree('@ocap', '{}/@ocap'.format(RELEASE_PATH))

	# Pbo addon
	subprocess.run([
		config.PBO_MANAGER_EXE,
		'-pack',
		'{}/@ocap/addons/ocap'.format(RELEASE_PATH),
		'{}/@ocap/addons/ocap.pbo'.format(RELEASE_PATH),
	], stdout=subprocess.PIPE)

	# Delete addon source files
	shutil.rmtree('{}/@ocap/addons/ocap'.format(RELEASE_PATH))

	# Copy extension into addon folder
	shutil.copy(
		'extension/OCAPExporter/OCAPExporter/bin/x64/Debug/{}'.format(EXTENSION_FILENAME),
		'{}/@ocap/{}'.format(RELEASE_PATH, EXTENSION_FILENAME)
	)

	print('Release created in folder: {}'.format(RELEASE_PATH))
	do_copy = input('Copy this release into your local Arma folder too? WARNING: This will overwrite any existing OCAP addon/userconfig/extension [Y/n]').upper()
	if do_copy == 'Y' or do_copy == '':
		copy_release_to_arma()


make_release()