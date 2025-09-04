import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { over } from "stompjs";
import SearchBar from "../components/other/SearchBar";
import GroupManager from "./GroupManager";
import axios from "axios";

var stompClient = null;

export const ChatPage2 = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [tab, setTab] = useState("CHATROOM");
  const [publicChats, setPublicChats] = useState([]);
  const [privateChats, setPrivateChats] = useState(new Map());
  const [groupChats, setGroupChats] = useState(new Map());
  const [username] = useState(localStorage.getItem("chat-username"));
  const [isConnected, setIsConnected] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const connected = useRef(false);
  const fileInputRef = useRef(null);

  if (!username.trim()) {
    navigate("/login");
  }

  useEffect(() => {
    fetchGroups();
    fetchPublicChatHistory();
    
    if (!connected.current) {
      connect();
    }
    return () => {
      if (stompClient) {
        stompClient.disconnect();
        connected.current = false;
        setIsConnected(false);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [publicChats, privateChats, groupChats, tab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/groups");
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  // Fetch public chat history
  const fetchPublicChatHistory = async () => {
  try {
    setIsLoadingHistory(true);
    const response = await axios.get(
      `http://localhost:8080/api/users/messages/public`
    );
    if (response.status === 200) {
      setPublicChats(response.data);
    }
  } catch (error) {
    console.error("Error fetching public chat history:", error);
    // Fallback: try to get all messages and filter for public ones
    try {
      const response = await axios.get(
        `http://localhost:8080/api/users/messages`
      );
      if (response.status === 200) {
        const publicMessages = response.data.filter(msg => 
          !msg.receiverName || msg.receiverName === '' || msg.receiverName === null
        );
        setPublicChats(publicMessages);
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }
  } finally {
    setIsLoadingHistory(false);
  }
};

  // Fetch online users
  const fetchOnlineUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/users/online-users");
      setOnlineUsers(new Set(response.data));
    } catch (error) {
      console.error("Error fetching online users:", error);
    }
  };

  // Upload file to server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:8080/api/users/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('File upload failed:', error);
      return null;
    }
  };

  const handlePrivateMessage = (user) => {
    setSelectedUser(user);
    setReceiver(user.username);

    if (!privateChats.has(user.username)) {
      privateChats.set(user.username, []);
      setPrivateChats(new Map(privateChats));
    }
    setTab(user.username);
    fetchChatHistory(username, user.username);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setTab(`group-${group.id}`);
    fetchGroupMessages(group.id);
  };

  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setMediaPreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setMediaPreview('file');
      }
    }
  };

  const onMessageReceived = (payload) => {
    const payloadData = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        if (payloadData.senderName !== username) {
          if (!privateChats.get(payloadData.senderName)) {
            privateChats.set(payloadData.senderName, []);
            setPrivateChats(new Map(privateChats));
          }
        }
        break;
      case "LEAVE":
        if (payloadData.senderName !== username) {
          if (privateChats.get(payloadData.senderName)) {
            privateChats.delete(payloadData.senderName);
            setPrivateChats(new Map(privateChats));
          }
        }
        break;
      case "MESSAGE":
        setPublicChats((prev) => [...prev, payloadData]);
        break;
      default:
        console.warn("Unknown status received:", payloadData.status);
    }
  };

  const onPrivateMessage = (payload) => {
    const payloadData = JSON.parse(payload.body);
    if (privateChats.has(payloadData.senderName)) {
      privateChats.get(payloadData.senderName).push(payloadData);
    } else {
      privateChats.set(payloadData.senderName, [payloadData]);
    }
    setPrivateChats(new Map(privateChats));
  };

  const onGroupMessage = (payload) => {
    const payloadData = JSON.parse(payload.body);
    const groupId = payloadData.groupId;
    
    if (groupId) {
      if (groupChats.has(groupId)) {
        groupChats.get(groupId).push(payloadData);
      } else {
        groupChats.set(groupId, [payloadData]);
      }
      setGroupChats(new Map(groupChats));
    }
  };

  const onOnlineUsersUpdate = (payload) => {
    const onlineUsersList = JSON.parse(payload.body);
    setOnlineUsers(new Set(onlineUsersList));
  };

  const onConnect = () => {
    connected.current = true;
    setIsConnected(true);

    stompClient.subscribe("/chatroom/public", onMessageReceived);
    stompClient.subscribe(`/user/${username}/private`, onPrivateMessage);
    stompClient.subscribe("/topic/online-users", onOnlineUsersUpdate);
    
    // Subscribe to group topics
    groups.forEach(group => {
      stompClient.subscribe(`/topic/group/${group.id}`, onGroupMessage);
    });

    userJoin();
    fetchOnlineUsers();
  };

  const onError = (err) => {
    console.error("WebSocket connection error:", err);
    setIsConnected(false);
  };

  const connect = () => {
    let sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(sock);
    stompClient.connect({}, onConnect, onError);
  };

  const userJoin = () => {
    let chatMessage = {
      senderName: username,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  };

  const userLeft = () => {
    let chatMessage = {
      senderName: username,
      status: "LEAVE",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  };

  const handleLogout = () => {
    userLeft();
    localStorage.removeItem("chat-username");
    navigate("/login");
  };

  const sendMessage = async () => {
    let mediaFilename = '';
    
    if (mediaFile) {
      setFileUploading(true);
      mediaFilename = await uploadFile(mediaFile);
      setFileUploading(false);
      if (!mediaFilename) return;
    }
    
    if (message.trim().length > 0 || mediaFilename) {
      stompClient.send(
        "/app/message",
        {},
        JSON.stringify({
          senderName: username,
          status: "MESSAGE",
          media: mediaFilename,
          mediaType: mediaFile ? mediaFile.type : '',
          message: message,
        })
      );
      setMessage("");
      setMediaFile(null);
      setMediaPreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const sendPrivate = async () => {
    let mediaFilename = '';
    
    if (mediaFile) {
      setFileUploading(true);
      mediaFilename = await uploadFile(mediaFile);
      setFileUploading(false);
      if (!mediaFilename) return;
    }
    
    if (message.trim().length > 0 && receiver) {
      let chatMessage = {
        senderName: username,
        receiverName: receiver,
        message: message,
        media: mediaFilename,
        mediaType: mediaFile ? mediaFile.type : '',
        status: "MESSAGE",
      };

      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setMessage("");
      setMediaFile(null);
      setMediaPreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const sendGroupMessage = async () => {
    if (!selectedGroup) return;
    
    let mediaFilename = '';
    
    if (mediaFile) {
      setFileUploading(true);
      mediaFilename = await uploadFile(mediaFile);
      setFileUploading(false);
      if (!mediaFilename) return;
    }
    
    if (message.trim().length > 0 || mediaFilename) {
      stompClient.send(
        "/app/group-message",
        {},
        JSON.stringify({
          groupId: selectedGroup.id,
          senderName: username,
          message: message,
          media: mediaFilename,
          mediaType: mediaFile ? mediaFile.type : '',
        })
      );
      setMessage("");
      setMediaFile(null);
      setMediaPreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const tabReceiverSet = (name) => {
    setReceiver(name);
    setTab(name);
    fetchChatHistory(username, name);
  };

  const fetchChatHistory = async (user1, user2) => {
    try {
      setIsLoadingHistory(true);
      const response = await axios.get(
        `http://localhost:8080/api/users/messages/history/${user1}/${user2}`
      );
      if (response.status === 200) {
        setPrivateChats((prevChats) => {
          const newChats = new Map(prevChats);
          newChats.set(user2, response.data);
          return newChats;
        });
      }
    } catch (error) {
      console.error("Error fetching chat history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchGroupMessages = async (groupId) => {
    try {
      setIsLoadingHistory(true);
      const response = await axios.get(
        `http://localhost:8080/api/groups/${groupId}/messages`
      );
      if (response.status === 200) {
        setGroupChats((prevChats) => {
          const newChats = new Map(prevChats);
          newChats.set(groupId, response.data);
          return newChats;
        });
      }
    } catch (error) {
      console.error("Error fetching group messages:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getFileUrl = (filename) => {
    return `http://localhost:8080/api/users/files/${filename}`;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const toggleGroupManager = () => {
    setShowGroupManager(!showGroupManager);
  };

  const isUserOnline = (username) => {
    return onlineUsers.has(username);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h1 className="text-xl font-bold text-gray-800">Chat App</h1>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">{username}</span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <SearchBar onUserSelect={handlePrivateMessage} />
        </div>

        {/* Online Users */}
        <div className="px-4 pb-2">
          <div className="bg-green-50 p-3 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Online Users ({onlineUsers.size})
            </h3>
            <div className="space-y-1">
              {Array.from(onlineUsers).map((user, index) => (
                <div key={index} className="text-sm text-green-700 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {user}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Groups Button */}
        <div className="px-4 pb-2">
          <button
            onClick={toggleGroupManager}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {showGroupManager ? "Back to Chat" : "Manage Groups"}
          </button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {/* Public Chat Room */}
            <div
              className={`p-3 rounded-lg cursor-pointer flex items-center mb-2 ${
                tab === "CHATROOM" ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => setTab("CHATROOM")}
            >
              <div className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center text-white mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">Chat Room</h3>
                </div>
                <p className="text-sm text-gray-500">Public group chat</p>
              </div>
            </div>

            {/* Groups */}
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => handleGroupSelect(group)}
                className={`p-3 rounded-lg cursor-pointer flex items-center mb-2 ${
                  tab === `group-${group.id}` ? "bg-purple-100" : "hover:bg-gray-100"
                }`}
              >
                <div className="bg-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">{group.name}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{group.members?.length || 0} members</p>
                </div>
              </div>
            ))}

            {/* Private Chats */}
            {[...privateChats.keys()].map((name, index) => (
              <div
                key={index}
                onClick={() => tabReceiverSet(name)}
                className={`p-3 rounded-lg cursor-pointer flex items-center mb-2 ${
                  tab === name ? "bg-blue-100" : "hover:bg-gray-100"
                }`}
              >
                <div className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center text-white mr-3">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">{name}</h3>
                    <div className={`w-2 h-2 rounded-full ${isUserOnline(name) ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {privateChats.get(name)?.length > 0 && 
                      privateChats.get(name)[privateChats.get(name).length - 1].message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {!showGroupManager ? (
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {tab === "CHATROOM"
                  ? publicChats.map((message, index) => (
                      <MessageBubble key={index} message={message} username={username} getFileUrl={getFileUrl} formatTime={formatTime} />
                    ))
                  : tab.startsWith("group-")
                  ? groupChats.get(selectedGroup?.id)?.map((message, index) => (
                      <MessageBubble key={index} message={message} username={username} getFileUrl={getFileUrl} formatTime={formatTime} isGroup={true} />
                    ))
                  : privateChats.get(tab)?.map((message, index) => (
                      <MessageBubble key={index} message={message} username={username} getFileUrl={getFileUrl} formatTime={formatTime} />
                    ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            {mediaPreview && (
              <div className="mb-3 relative">
                <div className="bg-gray-100 p-2 rounded-lg inline-block">
                  {mediaPreview !== 'file' ? (
                    <img src={mediaPreview} alt="Preview" className="h-20 rounded" />
                  ) : (
                    <div className="flex items-center p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{mediaFile.name}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setMediaFile(null);
                    setMediaPreview("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  className="w-full p-3 border border-gray-300 rounded-full pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="text"
                  placeholder="Type your message..."
                  value={message}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") {
                      if (tab === "CHATROOM") sendMessage();
                      else if (tab.startsWith("group-")) sendGroupMessage();
                      else sendPrivate();
                    }
                  }}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <label
                  htmlFor="file"
                  className="absolute right-3 top-3 text-gray-400 hover:text-blue-500 cursor-pointer"
                  title="Attach file"
                >
                  {fileUploading ? (
                    <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  )}
                </label>
                <input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*"
                />
              </div>
              <button
                onClick={() => {
                  if (tab === "CHATROOM") sendMessage();
                  else if (tab.startsWith("group-")) sendGroupMessage();
                  else sendPrivate();
                }}
                disabled={(!message.trim() && !mediaFile) || fileUploading}
                className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gray-50 p-6">
          <GroupManager baseUrl="http://localhost:8080" />
        </div>
      )}
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, username, getFileUrl, formatTime, isGroup = false }) => (
  <div className={`flex ${message.senderName !== username ? "justify-start" : "justify-end"}`}>
    <div
      className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2 ${
        message.senderName !== username
          ? "bg-white border border-gray-200 rounded-tl-none"
          : "bg-blue-600 text-white rounded-tr-none"
      }`}
    >
      {message.senderName !== username && (
        <div className="text-xs font-medium text-blue-600 mb-1">
          {message.senderName}
          {isGroup && message.groupName && ` (${message.groupName})`}
        </div>
      )}
      <div className="text-sm">{message.message}</div>
      {message.media && (
        <div className="mt-2">
          {message.mediaType && message.mediaType.startsWith('image/') ? (
            <img src={getFileUrl(message.media)} alt="Shared content" className="rounded-lg max-w-full h-auto" />
          ) : message.mediaType && message.mediaType.startsWith('video/') ? (
            <video controls className="rounded-lg max-w-full h-auto">
              <source src={getFileUrl(message.media)} type={message.mediaType} />
            </video>
          ) : message.media ? (
            <a href={getFileUrl(message.media)} download className="text-blue-500 underline">
              Download File
            </a>
          ) : null}
        </div>
      )}
      <div className={`text-xs mt-1 ${message.senderName === username ? 'text-blue-200' : 'text-gray-500'} text-right`}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  </div>
);