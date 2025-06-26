FROM node:lts 
WORKDIR /usr/src/app 
COPY my-node-app/package*.json ./ 
RUN npm install 
COPY . . 
EXPOSE 3000 
CMD ["node", "app.js"]