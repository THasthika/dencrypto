#!/usr/bin/env node

/**
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE 
INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR 
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, 
DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR 
IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
**/

/**
dencrypto: A file encryption program
usage:
	encrypt -d ./folder --delete -p mypassword
	decrypt -d ./folder --delete -p mypassword
options:
	use encrypt or decrypt keywords to choose the type of action
	-d or --directory [folder_path] - the folder to be encrypted
	-f or --file [file_path] - the file to be encrypted
	--delete - delete the source file after encryption (works both ways)
	-p or --password [password] set a custom password
**/


var crypto = require("crypto");
var fs = require("fs");
var fsWalk = require("fs-walk");
var path = require("path");
var encryptor = require("file-encryptor");
var colors = require("colors");

var PASSWORD = "6e2cb4a07e2a85293ae65c2d627be55531720175";
var MAX_FILES = 20;

var TAB = "\t";
var NL = "\n";

var options = { algorithm: 'aes-256-cbc' };

function encryptedFileName(file)
{
	var nameCipher = crypto.createCipher('aes-256-cbc', PASSWORD);
	var name = nameCipher.update(path.basename(file), 'utf8', 'hex');
	name += nameCipher.final('hex');
	return path.join(path.dirname(file), name + ".enc");
}

function decryptedFileName(file)
{
	var nameDecipher = crypto.createDecipher('aes-256-cbc', PASSWORD);
	var name = nameDecipher.update(path.basename(file, ".enc"), 'hex', 'utf8');
	name += nameDecipher.final('utf8');
	return path.join(path.dirname(file), name);
}

function encryptFile(file, cb)
{
	var name = encryptedFileName(file);
	encryptor.encryptFile(file, encryptedFileName(file), PASSWORD, options, function(err) {
		if(cb) cb(err, file, name);
	});
}

function decryptFile(file, cb)
{
	var name = decryptedFileName(file);
	encryptor.decryptFile(file, name, PASSWORD, options, function(err) {
		if(cb) cb(err, file, name);
	});
}

function getFiles(directory, cb)
{
	var files = [];
	fsWalk.files(directory, function(baseDir, filename, stat, next) {
		if(path.extname(filename) != ".enc")
		{
			var filepath = path.join(baseDir, filename);
			files.push(filepath);
			next();
		}
		else
			next();
	}, function(err) {
		if(err) throw err;
		cb(files);
	});
}

function getEncryptedFiles(directory, cb)
{
	var files = [];
	fsWalk.files(directory, function(baseDir, filename, stat, next) {
		if(path.extname(filename) == ".enc")
		{
			var filepath = path.join(baseDir, filename);
			files.push(filepath);
			next();
		}
		else
			next();
	}, function(err) {
		if(err) throw err;
		cb(files);
	});
}

function encryptDirectory(directory, cbPerFile, cb)
{
	var currentFiles = 0;
	var runEncryption = function(files)
	{
		while(currentFiles < MAX_FILES && files.length > 0)
		{
			currentFiles++;
			encryptFile(files.shift(), function(err, file, name) {
				cbPerFile(file, name);
				currentFiles--;
				if(files.length == 0 && currentFiles == 0)
					cb();
				else
					runEncryption(files);
			});
		}
		if(files.length == 0 && currentFiles == 0)
			cb();
	}
	getFiles(directory, function(files) {
		runEncryption(files);
	});
}

function decryptDirectory(directory, cbPerFile, cb)
{
	var currentFiles = 0;
	var runDecryption = function(files)
	{
		while(currentFiles < MAX_FILES && files.length > 0)
		{
			currentFiles++;
			decryptFile(files.shift(), function(err, file, name) {
				cbPerFile(file, name);
				currentFiles--;
				if(files.length == 0 && currentFiles == 0)
					cb();
				else
					runDecryption(files);
			});
		}
		if(files.length == 0 && currentFiles == 0)
			cb();
	}
	getEncryptedFiles(directory, function(files) {
		runDecryption(files);
	});
}

function start()
{		
	var args = process.argv;
	args.shift();
	args.shift();

	var target = false;
	var IS_FILE_ = false;
	var IS_DELTE_FILE_ = false;

	for(var i = 0; i < args.length; i++)
	{
		switch(args[i])
		{
			case "-h":
			case "--help":
				var help = NL+"dencrypto: A file encryption program".underline+NL+NL+
				"usage:".underline+NL+
					TAB+"encrypt -d ./folder --delete -p mypassword"+NL+
					TAB+"decrypt -d ./folder --delete -p mypassword"+NL+NL+
				"options:".underline+NL+
					TAB+"use encrypt or decrypt keywords to choose the type of action"+NL+
					TAB+"-d or --directory [folder_path] - the folder to be encrypted"+NL+
					TAB+"-f or --file [file_path] - the file to be encrypted"+NL+
					TAB+"--delete - delete the source file after encryption (works both ways)"+NL+
					TAB+"-p or --password [password] set a custom password"+NL;
				console.log(help);
				process.exit(0);
				break;
			case "-d":
			case "--directory":
				target = args[i+1];
				IS_FILE_ = false;
				break;
			case "-f":
			case "--file":
				target = args[i+1];
				IS_FILE_ = true;
				break;
			case "-p":
			case "--password":
				PASSWORD = args[i+1];
			case "--delete":
				IS_DELTE_FILE_ = true;
				break;
		}
	}

	var type = args.shift();

	switch(type)
	{
		case "encrypt":
			if(IS_FILE_)
				encryptFile(target, function(err) {
					if(IS_DELTE_FILE_)
						fs.unlink(target);
					console.log("file encrypted!".green);
				});
			else
				encryptDirectory(target, function(file, name) {
					console.log(("encrypted: " + file + " --> " + name).yellow);
					if(IS_DELTE_FILE_)
						fs.unlink(file);
				}, function() {
					console.log("all files encrypted!".green);
				});
			break;
		case "decrypt":
			if(IS_FILE_)
				decryptFile(target, function(err) {
					if(IS_DELTE_FILE_)
						fs.unlink(target);
					console.log("file decrypted!".green);
				});
			else
				decryptDirectory(target, function(file, name) {
					console.log(("decrypted: " + file + " --> " + name).yellow);
					if(IS_DELTE_FILE_)
						fs.unlink(file);
				}, function() {
					console.log("all files decrypted!".green);
				});
			break;
	}


}


start();