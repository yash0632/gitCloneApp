const fs = require("fs");
const path = require("path");
const zlib = require("zlib")
const bcrypt = require("bcrypt")
const crypto = require("crypto");
const { fileURLToPath } = require("url");

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
        
        createHashObject();
        break;

    case "ls-tree":
      getLsTree();
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

async function createHashObject(){
    const write = process.argv[3];
    if(write != "-w"){
        throw new Error(`Unknown Command ${write}`)
        
    }
    const fileName = process.argv[4];
    const fileData = fs.readFileSync(path.join(process.cwd(),fileName));
    const size = fileData.BYTES_PER_ELEMENT;

    const gitData = `blob ${fs.statSync(fileName).size}\0${fileData.toString()}`;
    
    let hashedGitFileName = crypto.createHash("sha1").update(gitData).digest("hex");
    
    var compressedData = zlib.deflateSync(gitData);
    

    fs.mkdirSync(path.join(process.cwd(),".git","objects",hashedGitFileName.substring(0,2)),{recursive:true})
    fs.writeFileSync(path.join(process.cwd(),".git","objects",hashedGitFileName.substring(0,2),hashedGitFileName.substring(2)),compressedData);


    process.stdout.write(hashedGitFileName);
}


function getLsTree(){
  const method = process.argv[3];
  if(method != "--name-only"){
    throw new Error("not name only");
  }

  const tree_sha = process.argv[4];
  const zipContent = fs.readFileSync(path.join(process.cwd(),".git","objects",tree_sha.substring(0,2),tree_sha.substring(2)));


  let content;
  const buffer = Buffer.from(zipContent,"base64");
  zlib.unzip(buffer,(err,buffer)=>{
    if(err){
      console.log("an error occured");
      process.exitCode = 1;
    }
    content = buffer.toString();

    //console.log(content);

    let treeFileName = "";
    content = content.replaceAll("\x0040000 ","#&");
    content = content.replaceAll("40000 ","#&");
    content = content.replaceAll("\x00100644 ","#&");
    content = content.replaceAll("100644 ","#&");
    content = content.replaceAll("\x00100755 ","#&");
    content = content.replaceAll("00755 ","#&");

    content = content.replaceAll("\x00120000 ","#&");
    content = content.replaceAll("120000 ","#&");
    content = content.replaceAll("\x00","&#");
    //console.log(content);
    
    let take = false
    let arr = [];
    for(let i = 0;i < content.length;i++){
      if(i==0)continue;
      if(content[i] == "&" && content[i+1] == "#"){
        take=false;
        treeFileName = treeFileName + "\n";
        arr.push(i);
      }
      if(take == true){
        treeFileName = treeFileName + content[i];
      }
      if(content[i] == "&" && content[i-1] == "#"){
        take = true;
        arr.push(i);
      }
      
    }

    process.stdout.write(treeFileName);

  })
}