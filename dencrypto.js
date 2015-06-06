#!/usr/bin/env node


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

var IS_FILE_ = false;
var IS_DELTE_FILE_ = false;
var PASSWORD = "6e2cb4a07e2a85293ae65c2d627be55531720175";

var TAB = "\t";
var NL = "\n";

var options = { algorithm: 'aes-256-cbc' };

function encryptedFileName(file)
{
	var nameCipher = crypto.createCipher('aes-256-cbc', PASSWORD);
	nameCipher.update(path.basename(file), 'utf8', 'hex');
	return path.join(path.dirname(file), nameCipher.final('hex') + ".enc");
}

function decryptedFileName(file)
{
	var nameDecipher = crypto.createDecipher('aes-256-cbc', PASSWORD);
	nameDecipher.update(path.basename(file, ".enc"), 'hex', 'utf8');
	return path.join(path.dirname(file), nameDecipher.final('utf8'));
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

function encryptDirectory(directory, cbPerFile, cb)
{
	fsWalk.files(directory, function(baseDir, filename, stat, next) {
		if(path.extname(filename) != ".enc")
		{
			var filepath = path.join(baseDir, filename);
			encryptFile(filepath, function(err, file, name) {
				cbPerFile(file, name);
				next();
			});
		}
		else
			next();
	}, function(err) {
		if(err) throw err;
		cb();
	});
}

function decryptDirectory(directory, cbPerFile, cb)
{
	fsWalk.files(directory, function(baseDir, filename, stat, next) {
		if(path.extname(filename) == ".enc")
		{
			var filepath = path.join(baseDir, filename);
			decryptFile(filepath, function(err, file, name) {
				cbPerFile(file, name);
				next();
			});
		}
		else
			next();
	}, function(err) {
		if(err) throw err;
		cb();
	});	
}

function start()
{		
	var args = process.argv;
	args.shift();
	args.shift();

	console.log(args);

	var target = false;

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
						fs.unlink(file);
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
						fs.unlink(file);
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