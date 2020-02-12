const { ApolloServer, gql } = require("apollo-server-express"); //include apollo server
const path = require("path");
const express = require("express");
const { createWriteStream, existsSync } = require("fs");
const mysql = require('mysql');
const files = [];

var koneksi=mysql.createPool({ //membuat koneksi dengan pool mysql 
  host:'localhost',
  user:"root",
  password:"",
  database:"test_upload_graphql",
  connectionLimit: 2,
})

function query_mysql(query,val,callback){ //function untuk menjalankan query 
  return new Promise((resolve,reject)=>{ //Untuk return data 
      var result = [{}];
      koneksi.getConnection(function(error, connection){    
          //run the query
          connection.query(query,val,function(err, rows){
              connection.destroy();

              if(error){
                  reject(error);
              }
              
              if(rows){
                  if(rows.length>0){
                      result = JSON.parse(JSON.stringify(rows));
                      resolve(result);
                  }
              }
  
              resolve([{}]);
          });
        });
  })
}


const typeDefs = gql`
  type Query {
    files: [String]
  }
  type Mutation {
    uploadGambar(file: Upload!): Boolean #tipe file upload
  }
`;

const resolvers = {
  Query: {
    files: () => files
  },
  Mutation: {
    uploadGambar: async (_, { file }) => { //mutation untuk upload gambar 
      const { createReadStream, filename } = await file; //Mengambil file 
      await new Promise(res =>
        createReadStream()
          .pipe(createWriteStream(path.join(__dirname, "./gambar", filename)))
          .on("close", res)
      );

      files.push(filename); //Mengambil nama file

      return query_mysql('INSERT INTO book_cover (image_url) VALUES (?)',"./images/"+filename).then(function(result){
          return true; //insert nama file ke tabel 
      });
    }
  }
};



const server = new ApolloServer({ typeDefs, resolvers });
const app = express();

existsSync(path.join(__dirname, "../gambar")); //memeriksa direktori file 
server.applyMiddleware({ app });

app.listen(4000, () => { //server berjalan pada port 4000 
  console.log("Serve on port 4000");
});