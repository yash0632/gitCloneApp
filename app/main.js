import fs from "fs";
import path from "path";
import zlib from "zlib"

import crypto from "crypto";



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
    
      let shadb = sha.substring(0,2);
      let shafile = sha.substring(2,sha.length);
      getBlob(shadb,shafile);
      
    
    //console.log("sha is",sha);
    break;

    case "hash-object":
        
        createHashObject();
        break;

    case "ls-tree":
      getLsTree();
      break;

    case "write-tree":
      createTree();
      break;

    case "commit-tree":
      commitObject();
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
      console.log("raj")
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





function dirTreeSha(directory){
  const directoryFiles = fs.readdirSync(directory).filter((file)=>file!=".git" && file != "main.js")
  
  
  
  let entries = [];
  let size = 0;
  
  for(let i = 0;i < directoryFiles.length;i++){
    //console.log(directory,"->",directoryFiles[i])
    if(directoryFiles[i]=='.git' && directoryFiles[i] == 'main.js'){

      continue;

    }
    else if(fs.statSync(path.join(directory,directoryFiles[i])).isDirectory() == false){
      
      const fileContent = fs.readFileSync(path.join(directory,directoryFiles[i]));
      //hash create
      const gitData = `blob ${fs.statSync(path.join(directory,directoryFiles[i])).size}\0${fileContent}`
      const hash = crypto.createHash('sha1').update(gitData).digest('hex');
      const compressedGitData = zlib.deflateSync(gitData);
      fs.mkdirSync(path.join(process.cwd(),".git","objects",hash.substring(0,2)),{recursive:true});

      fs.writeFileSync(path.join(process.cwd(),".git","objects",hash.substring(0,2),hash.substring(2)),compressedGitData);
      const hashNotHex = crypto.createHash('sha1').update(gitData).digest();

      
      
      //const mode = 100644
      entries.push({mode:100644,name:directoryFiles[i] ,hash})
      size += Buffer.from(`100644 ${directoryFiles[i]}\0`).length;
      size += Buffer.from(hash,'hex').length;

    }
    else if(fs.statSync(path.join(directory,directoryFiles[i])).isDirectory() == true){
      let newDirectory = path.join(directory,directoryFiles[i]);
      let dirHash = dirTreeSha(newDirectory);

      //const hashNotHex = crypto.createHash('sha1').update(dirHash).digest();
      size += Buffer.from(`40000 ${directoryFiles[i]}\0`).length;
      size += Buffer.from(dirHash,'hex').length;
      entries.push({mode:40000,name:directoryFiles[i],hash:dirHash});
    }
  }
  const treeData = entries.reduce((acc,{mode,name,hash}) => {
    return Buffer.concat([
      acc,
      Buffer.from(`${mode} ${name}\0`),
      Buffer.from(hash,'hex'),
    ])
  },Buffer.alloc(0));
  const tree = Buffer.concat([
      Buffer.from(`tree ${size}\x00`),
      treeData,
   ])
  //
  //treeContent = `tree ${treeData.length}\x00` + treeContent;
  const dirHashHex = crypto.createHash('sha1').update(tree).digest('hex');
  
  const compressedtreeContent = zlib.deflateSync(tree);
  fs.mkdirSync(path.join(process.cwd(),".git","objects",dirHashHex.substring(0,2)),{recursive:true});
  fs.writeFileSync(path.join(process.cwd(),".git","objects",dirHashHex.substring(0,2),dirHashHex.substring(2)),compressedtreeContent);
  
  return dirHashHex;
  

  


}
//dirHash=[dirHashHex,dirHashWithoutHex]
function createTree(){
  //first goes to end
  const dirHash = dirTreeSha('./');
  process.stdout.write(dirHash);
}

function commitObject(){
  const treeSha = process.argv[3];
  const parentCommitSha = process.argv.slice(process.argv.indexOf('-p'),process.argv.indexOf('-p')+2)[1];
  const message = process.argv.slice(process.argv.indexOf('-m'), process.argv.indexOf('-m')+2)[1];


  const commitContentBuffer = Buffer.concat([
    Buffer.from(`tree ${treeSha}\n`),
    Buffer.from(`parent ${parentCommitSha}\n`),
    Buffer.from(`author The Commiter <thecommitter@test.com> ${Date.now} +0000\n`),
    Buffer.from(`commiter The Commiter <thecommitter@test.com> ${Date.now} +0000\n`),
    Buffer.from(`${message}\n`)
  ])

  const commitBuffer = Buffer.concat([
    Buffer.from(`commit ${commitContentBuffer.length}\0`),
    commitContentBuffer
  ])

  const commitHash = crypto.createHash('sha1').update(commitBuffer).digest('hex');
  const zipCommit = zlib.deflateSync(commitBuffer);
  fs.mkdirSync(path.join(process.cwd(),'.git','objects',commitHash.substring(0,2)),{recursive:true});
  fs.writeFileSync(path.join(process.cwd(),'.git','objects',commitHash.substring(0,2),commitHash.substring(2)),zipCommit);
  process.stdout.write(commitHash);
}