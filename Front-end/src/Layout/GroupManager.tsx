import React, { useEffect, useState } from "react";
import axios from "axios";

// Define models based on your backend entities
type User = {
  id: number;
  username: string;
  name: string;
  email: string;
};

type Group = {
  id: number;
  name: string;
  members: User[];
};

type GroupMessageDTO = {
  id: number;
  senderName: string;
  message: string;
  timestamp: string;
  groupName?: string;
};

interface GroupManagerProps {
  baseUrl?: string;
  authToken?: string;
  onGroupSelect?: (group: Group) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ 
  baseUrl = "http://localhost:8080", 
  authToken,
  onGroupSelect 
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [usernameToAdd, setUsernameToAdd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [groupMessages, setGroupMessages] = useState<GroupMessageDTO[]>([]);

  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  // Fetch groups
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get<Group[]>(`${baseUrl}/api/groups`, { headers });
      setGroups(res.data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching groups", err);
      setError("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  // Fetch group messages
  const fetchGroupMessages = async (groupId: number) => {
    try {
      const response = await axios.get<GroupMessageDTO[]>(
        `${baseUrl}/api/groups/${groupId}/messages`,
        { headers }
      );
      return response.data;
    } catch (err: any) {
      console.error("Error fetching group messages", err);
      return [];
    }
  };

  // Search for users by username
  const searchUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await axios.get(
        `${baseUrl}/api/users/search?username=${encodeURIComponent(searchTerm)}`,
        { headers }
      );
      
      if (response.data) {
        setSearchResults([response.data]);
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      console.error("Error searching users", err);
      setSearchResults([]);
      if (err.response?.status === 404) {
        setError("User not found");
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Load messages when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMessages(selectedGroup.id).then(messages => {
        setGroupMessages(messages);
      });
    }
  }, [selectedGroup]);

  // Create group
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const response = await axios.post(
        `${baseUrl}/api/groups`,
        { name: newGroupName },
        { headers }
      );
      
      if (response.status === 200 || response.status === 201) {
        setNewGroupName("");
        setSuccess("Group created successfully!");
        await fetchGroups(); // Refresh the groups list
      }
    } catch (err: any) {
      console.error("Error creating group", err);
      setError(err.response?.data || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  // Add user to group
  const handleAddUser = async () => {
    if (!selectedGroup || !usernameToAdd.trim()) {
      setError("Please select a group and enter a username");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      // First search for the user to get their ID
      await searchUsers(usernameToAdd);
      
      if (searchResults.length === 0) {
        setError("User not found. Please check the username and try again.");
        return;
      }

      const userToAdd = searchResults[0];
      
      const response = await axios.post(
        `${baseUrl}/api/groups/${selectedGroup.id}/addUser/${userToAdd.id}`,
        {},
        { headers }
      );

      if (response.status === 200) {
        setUsernameToAdd("");
        setSearchResults([]);
        setSuccess(`User ${userToAdd.username} added to group successfully!`);
        
        // Refresh the selected group to show updated members
        const updatedGroups = await axios.get<Group[]>(
          `${baseUrl}/api/groups`,
          { headers }
        );
        setGroups(updatedGroups.data);
        
        const updatedGroup = updatedGroups.data.find(g => g.id === selectedGroup.id);
        if (updatedGroup) {
          setSelectedGroup(updatedGroup);
        }
      }
    } catch (err: any) {
      console.error("Error adding user to group", err);
      setError(err.response?.data || "Failed to add user to group");
    } finally {
      setLoading(false);
    }
  };

  // Remove user from group
  const handleRemoveUser = async (userId: number) => {
    if (!selectedGroup) {
      setError("Please select a group first");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const response = await axios.delete(
        `${baseUrl}/api/groups/${selectedGroup.id}/removeUser/${userId}`,
        { headers }
      );

      if (response.status === 200) {
        setSuccess("User removed from group successfully!");
        
        // Refresh the selected group to show updated members
        const updatedGroups = await axios.get<Group[]>(
          `${baseUrl}/api/groups`,
          { headers }
        );
        setGroups(updatedGroups.data);
        
        const updatedGroup = updatedGroups.data.find(g => g.id === selectedGroup.id);
        if (updatedGroup) {
          setSelectedGroup(updatedGroup);
        }
      }
    } catch (err: any) {
      console.error("Error removing user from group", err);
      setError(err.response?.data || "Failed to remove user from group");
    } finally {
      setLoading(false);
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: number) => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      
      const response = await axios.delete(
        `${baseUrl}/api/groups/${groupId}`,
        { headers }
      );

      if (response.status === 200) {
        setSuccess("Group deleted successfully!");
        setSelectedGroup(null);
        await fetchGroups(); // Refresh the groups list
      }
    } catch (err: any) {
      console.error("Error deleting group", err);
      setError(err.response?.data || "Failed to delete group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Group Manager</h2>
      
      {/* Status Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Group Creation and List */}
        <div className="space-y-6">
          {/* Create Group Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Create New Group</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleCreateGroup}
                disabled={loading || !newGroupName.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>

          {/* Groups List */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Your Groups</h3>
            {loading && !groups.length ? (
              <p className="text-gray-500">Loading groups...</p>
            ) : groups.length === 0 ? (
              <p className="text-gray-500">No groups yet. Create one to get started!</p>
            ) : (
              <ul className="space-y-2">
                {groups.map((group) => (
                  <li
                    key={group.id}
                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${
                      selectedGroup?.id === group.id
                        ? "bg-blue-100 border border-blue-300"
                        : "bg-white border border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div>
                      <h4 className="font-medium text-gray-800">{group.name}</h4>
                      <p className="text-sm text-gray-600">
                        {(group.members || []).length} members {/* Handle undefined members */}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGroup(group.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete group"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Group Details */}
        <div className="space-y-6">
          {selectedGroup ? (
            <>
              {/* Group Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  {selectedGroup.name} - Members
                </h3>
                
                {/* Add User Form */}
                <div className="mb-4">
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={usernameToAdd}
                      onChange={(e) => {
                        setUsernameToAdd(e.target.value);
                        setSearchResults([]);
                      }}
                      placeholder="Enter username to add"
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <button
                      onClick={handleAddUser}
                      disabled={loading || !usernameToAdd.trim()}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Search Results */}
                  {isSearching && <p className="text-sm text-gray-500">Searching...</p>}
                  {searchResults.length > 0 && (
                    <div className="bg-white p-2 rounded border border-gray-200 mt-1">
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex justify-between items-center py-1">
                          <span className="text-sm">{user.username} ({user.name})</span>
                          <button
                            onClick={() => {
                              setUsernameToAdd(user.username);
                              setSearchResults([]);
                            }}
                            className="text-blue-500 text-sm"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Members List */}
                <ul className="space-y-2">
                  {(selectedGroup.members || []).map((member) => ( // Handle undefined members
                    <li
                      key={member.id}
                      className="bg-white p-3 rounded-lg border border-gray-200 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium text-gray-800">{member.username}</h4>
                        <p className="text-sm text-gray-600">{member.name}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(member.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Remove user"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recent Messages */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Recent Messages</h3>
                {groupMessages.length > 0 ? (
                  <div className="space-y-2">
                    {groupMessages.slice(-5).map((message) => (
                      <div key={message.id} className="bg-gray-50 p-2 rounded">
                        <p className="text-sm font-medium">{message.senderName}</p>
                        <p className="text-sm text-gray-600">{message.message}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No messages yet</p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center h-40">
              <p className="text-gray-500">Select a group to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManager;