// fs = File System — Node's built-in module for working with files and folders: read, write,
//   append, delete, rename, list. It's a built-in (no install)

// import fs from "fs"
// const data = fs.readFile("test.txt","utf-8",(error,data)=>{
//     if(error){
//         console.log(error);
//         return;
//     }
//     console.log(data);
// });

// import { writeFile, readFile,appendFile } from "fs/promises";

// const fileSysFunction = async () => {
//     try {
//         await writeFile("test.txt","hello from node js file system!!!");

//         const data = await readFile("test.txt","utf-8");
//         console.log(data);

//         await appendFile("test.txt","\nChecking how append works");

//         const appendedData = await readFile("test.txt","utf-8")
//         console.log(appendedData)
//     } catch (error) {
//         console.log(error);
//     }
// }

// fileSysFunction();

import {
  writeFile,
  readFile,
  appendFile,
  mkdir,
  rename,
  stat,
  readdir,
  unlink,
} from "fs/promises";

async function fileOperations() {
  try {
    // 1. Create a folder
    // await mkdir("myFolder");
    await mkdir("myFolder", { recursive: true });          //to run the program multiple times,use the recursive option
    console.log("✅ Folder created");

    // 2. Create a file
    await writeFile("myFolder/info.txt", "Hello Node.js!");
    console.log("✅ File created");

    // 3. Read the file
    const data = await readFile("myFolder/info.txt", "utf-8");
    console.log("📖 File content:", data);

    // 4. Append more text
    await appendFile("myFolder/info.txt", "\nLearning fs/promises");
    console.log("✅ Content appended");

    // 5. Read again
    const updatedData = await readFile("myFolder/info.txt", "utf-8");
    console.log("📖 Updated content:\n", updatedData);

    // 6. Rename the file
    await rename("myFolder/info.txt", "myFolder/details.txt");
    console.log("✅ File renamed");

    // 7. Get file stats
    const fileStats = await stat("myFolder/details.txt");
    console.log("📊 File size:", fileStats.size, "bytes");
    console.log("📅 Created at:", fileStats.birthtime);

    // 8. Reading Directory
    const files = await readdir(".");
    console.log(files);

    // 9. Delete the file
    await unlink("myFolder/details.txt");
    console.log("🗑️ File deleted");

  } catch (err) {
    console.log(err);
  }
}

fileOperations();