const fs = require("fs");
const path = require("path");
const zlib = require("zlib")
const bcrypt = require("bcrypt")

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

    case "hash-object":
        
        getHashObject();
        break;

  default:
    throw new Error(`Unknown command ${command}`);
}

function createGitDirectory() {
  console.log(process.cwd());
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

async function getHashObject(){
    const write = process.argv[3];
    if(write != "-w"){
        throw new Error(`Unknown Command ${write}`)
        
    }
    const fileName = process.argv[4];
    const fileData = fs.readFileSync(path.join(process.cwd(),fileName));
    const size = fileData.BYTES_PER_ELEMENT;

    const gitData = `blob ${size}\0${fileData.toString()}`;
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    let hashedGitFileName = await bcrypt.hash(gitData,salt);
    let newGitFileName = "";
    let start = 0;
    hashedGitFileName = hashedGitFileName.replaceAll("/","");
    hashedGitFileName = hashedGitFileName.replaceAll("$","");


    hashedGitFileName = hashedGitFileName.substring(0,40);
    

    var compressedData = zlib.deflateSync(gitData).toString();
    //console.log(__dirname);
    
    fs.mkdirSync(path.join(path.dirname(process.cwd()),".git","objects",hashedGitFileName.substring(0,2)),{recursive:true})
    fs.writeFileSync(path.join(path.dirname(process.cwd()),".git","objects",hashedGitFileName.substring(0,2),hashedGitFileName.substring(2,40)),compressedData);


    process.stdout.write(hashedGitFileName);
    //console.log(process.cwd());
    //console.log(path.dirname(path.dirname(process.cwd())))

}