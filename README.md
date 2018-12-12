# matcha

## Environment setup
```
brew install nginx
cp ./nginx.conf ~/.brew/etc/nginx/
brew services start nginx
brew service start mysql
```

### if no db initialized
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
```

### Compiles and hot-reloads for development
```
npm run serve

```
### Compiles and minifies for production
```
npm run build
```

#### run api :
```
cd api
npm run init-db
npm run start
```

```
Go to http://localhost:8080/
```

### Lints and fixes files
```
npm run lint
```
