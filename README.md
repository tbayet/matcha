# matcha

## Configure nginx file
```
vim nginx.conf
- Edit repertory location (> root /PATH/TO/DIR/dist/)
```

## Environment setup
```
brew install nginx
cp ./nginx.conf ~/.brew/etc/nginx/
brew services start nginx
brew service start mysql
```

### Create database
```
mysql -u root
> CREATE DATABASE matcha_db;
> CREATE USER 'admini'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
> GRANT ALL ON matcha_db.* TO 'admin'@'localhost';
> FLUSH PRIVILEGES;
```

## Project setup
```
npm install
npm run build
```

### Start API :
```
cd ./api/
npm run init-db
npm run start
```

```
Go to http://localhost:8080/
```
