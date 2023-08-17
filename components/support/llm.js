import * as webllm from "@mlc-ai/web-llm"
import { ChatWorkerHandler, ChatModule } from "@mlc-ai/web-llm"
//import {ref} from 'vue'   //TODO:add reactivity to init_label and generate_label


export class LLM {

    static run = true
    static init_label = ''
    static generate_label = ''
    static chat = ''

    //config ref: https://github.com/mlc-ai/web-llm/blob/main/examples/simple-chat/src/gh-config.js
    static async configure(){
        const myLlamaUrl = "https://huggingface.co/mlc-ai/mlc-chat-Llama-2-7b-chat-hf-q4f32_1/resolve/main/";
        const appConfig = {
            "model_list": [
              {
                "model_url": myLlamaUrl,
                "local_id": "Llama-2-7b-chat-hf-q4f32_1"
              }
            ],
            "model_lib_map": {
              "Llama-2-7b-chat-hf-q4f32_1": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf-q4f32_1-webgpu.wasm",
            }
        }
        // override default
        const chatOpts = {
          "repetition_penalty": 1.01
        }

        /* // without worker
        const chat = new ChatModule()
        */

        // worker in separate file
        this.chat = new webllm.ChatWorkerClient(new Worker(
            new URL('./llm_worker.js', import.meta.url),
            {type: 'module'}
          ))
        

        /*
        // test inline worker
        var blob = new Blob([ '(',`
        function(){
          self.onmessage = function(e){
            self.postMessage('msg from worker')
          }
        }`, 
        ')()' ], {type: 'text/javascript'} )

        var blobURL = URL.createObjectURL(blob)
        const worker = new Worker(blobURL)
        worker.onmessage = function(e){
          console.log('Received ' + e.data)
        }
        worker.postMessage('hello')
        */
        
        /*
        // worker in anonymous function  => TODO:inline worker fails because of incorrect import location
        //ref: stackoverflow, web workers without a separate javascript file
        var blob = new Blob([ '(',`
        function(){
        importScripts('../../../node_modules/@mlc-ai/web-llm')

        // Hookup a chat module to a worker handler
        const chat = new ChatModule();
        const handler = new ChatWorkerHandler(chat);
        self.onmessage = (msg) => {     //msg: MessageEvent
          handler.onmessage(msg);
        }
        }`, 
        ')()' ], {type: 'application/javascript'} )
        var blobURL = URL.createObjectURL(blob)
        const worker = new Worker(blobURL)
        this.chat = new webllm.ChatWorkerClient(worker)
        */

        this.chat.setInitProgressCallback((report) => {      //report: webllm.InitProgressReport
            this.init_label = report.text
            console.log(this.init_label)
        })

        await this.chat.reload("Llama-2-7b-chat-hf-q4f32_1", chatOpts, appConfig)     //"vicuna-v1-7b-q4f32_0") 
        return true
    }
        
    static generateProgressCallback = (_step, message) => {     //_step: number, message: string
        this.generate_label = message
    }

    static async createDialogue(prompt0){
        console.log('create dialogue...')
        //const prompt0 = "why is liquidity important in banking."
        const reply0 = await this.chat.generate(prompt0, this.generateProgressCallback)
        console.log(reply0)
        return reply0
    }
}