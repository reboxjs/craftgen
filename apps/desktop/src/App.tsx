import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";


function App() {
  // const command = Command.sidecar("binaries/welcome");
  const callFuncOnRust = async () => {
    // open("http://localhost:3000");
    invoke("start_edge_runtime").then(() => console.log("Completed!"));
  };
  useEffect(() => {
    console.log("setting up listening");
    const unsubscribe = listen("message", (event) => {
      console.log("Received", event);
    });
    

    return async () => {
      await unsubscribe();
    };
  }, []);
  return (
    <div className="container">
      <h1 className="text-2xl font-bold">Craftgen</h1>
      <button onClick={callFuncOnRust}>Open Craftgen</button>
      {/* {JSON.stringify(res)} */}
    </div>
  );
}

export default App;
