import { Configuration, OpenAIApi } from 'openai';
import { process } from './env.js';

import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, get, remove } from "firebase/database";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3Yd46JOx2odCekuCy0rLZPEkJ7fTMKcw",
    authDomain: "chatty-hub-openai.firebaseapp.com",
    databaseURL: "https://chatty-hub-openai-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "chatty-hub-openai",
    storageBucket: "chatty-hub-openai.appspot.com",
    messagingSenderId: "1077118136175",
    appId: "1:1077118136175:web:7757fadf53a0e836ce829a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

const conversationInDb = ref(database);

const chatbotConversation = document.getElementById('chatbot-conversation');

const instructionObj = {
        role: 'system',
        content: 'You are a useful assistant happy to help.'
};

document.addEventListener('submit', (e) => {
    e.preventDefault()
    const userInput = document.getElementById('user-input')    
    push(conversationInDb, {
        role: "user",
        content: userInput.value
    })
    fetchReply();
    const newSpeechBubble = document.createElement('div')
    newSpeechBubble.classList.add('speech', 'speech-human')
    chatbotConversation.appendChild(newSpeechBubble)
    newSpeechBubble.textContent = userInput.value
    userInput.value = ''
    chatbotConversation.scrollTop = chatbotConversation.scrollHeight
})

function fetchReply() {
    get(conversationInDb).then(async (snapshot) => {
        if (snapshot.exists()) {
            const conversationArr = Object.values(snapshot.val());
            conversationArr.unshift(instructionObj);
            const response = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: conversationArr,
                frequency_penalty: 0.3,
                presence_penalty: 0.5
            });
            push(conversationInDb, response.data.choices[0].message);    
            renderTypewriterText(response.data.choices[0].message.content);
        } else {
            console.log("No data available");
        }
    });
}

function renderTypewriterText(text) {
    const newSpeechBubble = document.createElement('div')
    newSpeechBubble.classList.add('speech', 'speech-ai', 'blinking-cursor')
    chatbotConversation.appendChild(newSpeechBubble)
    let i = 0
    const interval = setInterval(() => {
        newSpeechBubble.textContent += text.slice(i-1, i)
        if (text.length === i) {
            clearInterval(interval)
            newSpeechBubble.classList.remove('blinking-cursor')
        }
        i++
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight
    }, 10)
}

document.getElementById('clear-btn').addEventListener('click', () => {
    remove(conversationInDb);
    chatbotConversation.innerHTML = '<div class="speech speech-ai">How can I help you?</div>';
}); 

function renderConversationFromDb() {
    get(conversationInDb).then(async (snapshot) => {
        if (snapshot.exists()) {
            Object.values(snapshot.val()).forEach(dbObj => {
                const newSpeechBubble = document.createElement('div');
                newSpeechBubble.classList.add(
                    'speech', 
                    `speech-${dbObj.role === 'user' ? 'human' : 'ai'}`
                );
                chatbotConversation.appendChild(newSpeechBubble);
                newSpeechBubble.textContent = dbObj.content;
            });
        chatbotConversation.scrollTop = chatbotConversation.scrollHeight;                    
        }
    })
}
renderConversationFromDb();