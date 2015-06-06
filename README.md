#dencrypto: A file encryption program

##usage:
	```bash
	encrypt -d ./folder --delete -p mypassword
	decrypt -d ./folder --delete -p mypassword
	```

##options:
	use encrypt or decrypt keywords to choose the type of action
	```bash
	-d or --directory [folder_path] #the folder to be encrypted
	-f or --file [file_path] #the file to be encrypted
	--delete - delete the source #file after encryption (works both ways)
	-p or --password [password] #set a custom password
	```