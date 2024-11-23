const fs = require("fs");
const path = require("path");
const zlib = require("zlib")

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.error("Logs from your program will appear here!");

// Uncomment this block to pass the first stage
const command = process.argv[2];
//console.log("command:  ",command);

switch (command) {
  case "init":
    createGitDirectory();
    break;

  case "cat-file":
    const sha = process.argv[4];
    //console.log("sha is",sha);
    let shadb = sha.substring(0,2);
    let shafile = sha.substring(2,sha.length);
    getBlob(shadb,shafile);
    break;

  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  fs.mkdirSync(path.join(process.cwd(), ".git"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "objects"), { recursive: true });
  fs.mkdirSync(path.join(process.cwd(), ".git", "refs"), { recursive: true });

  fs.writeFileSync(path.join(process.cwd(), ".git", "HEAD"), "ref: refs/heads/main\n");
  console.log("Initialized git directory");
}

function getBlob(shadb,shafile){
    const zipfile = fs.readFileSync(path.join(process.cwd(),".git","objects",shadb,shafile));
    const buffer = Buffer.from(zipfile,'base64');
    zlib.unzip(buffer,(err,buffer)=>{
      if(err){
        console.log("an error occured");
        process.exit(1);
      }
      let data = buffer.toString();
      data = data.replace("\x00","|")
      let index = 0;
      for(let i = 0;i < data.length;i++){
        if(data[i] == '|'){
            index = i;
            break;
        }
      }
      
      let correctData = data.substring(index+1,data.length);
      
      process.stdout.write(correctData);
    })
  }