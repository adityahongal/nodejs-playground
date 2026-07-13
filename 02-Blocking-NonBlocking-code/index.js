// Blocking code vs Non blocking Code(eg. async await)
// libuv engine

// Blocking code/function 
//check order of execution with and without async

import fs from 'fs'

const func1 = () => {                                        // NON-BLOCKING: setTimeout hands the
    setTimeout(()=>{                                          // 2s timer to libuv and returns immediately.
        console.log("function 1 executed")                   // Callback runs LAST, after all sync code +
    },2000)                                                   // once the call stack is empty. (async keyword
}                                                             // not needed here — setTimeout is what defers it.)

const func2 = () => {
    console.log("function 2 executed")
}

const func3 = () => {
    console.log("function 3 executed")
}

// func1();
// func2();
// func3();


// example for synchronous function using "fs"

const func4 = () => {
    fs.writeFileSync("sample.txt","synchronous function 4 is executed and sample.txt file will be created");
    console.log("function 4 will block other functions till it completes it's execution")
}

func4();
func1();
func2();
func3();