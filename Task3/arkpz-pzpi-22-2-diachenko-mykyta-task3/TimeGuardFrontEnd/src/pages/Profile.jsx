import React, { useEffect, useState } from 'react';
import authService from '../services/authService';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import '../styles/App.css'

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');

  useEffect(() => {
    fetchUserInfo();
    fetchFriends();
    fetchFriendRequests();
    fetchSentFriendRequests();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await authService.getMe();
      setUserInfo(response.data);
    } catch (err) {
      toast.error('Failed to load user profile.');
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await apiService.getFriends();
      setFriends(response.data);
    } catch (err) {
      toast.error('Failed to load friends list.');
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await apiService.getFriendRequests();
      setFriendRequests(response.data);
    } catch (err) {
      toast.error('Failed to load incoming friend requests.');
    }
  };

  const fetchSentFriendRequests = async () => {
    try {
      const response = await apiService.getSentFriendRequests();
      setSentFriendRequests(response.data);
    } catch (err) {
      toast.error('Failed to load sent friend requests.');
    }
  };

  const handleSendFriendRequest = async () => {
    if (!newFriendEmail) {
      toast.error("Enter friend's email.");
      return;
    }
    if (newFriendEmail.toLowerCase() === userInfo.email.toLowerCase()) {
      toast.error('You cannot send a request to yourself.');
      return;
    }
    try {
      await apiService.sendFriendRequest(newFriendEmail);
      toast.success('Friend request sent successfully!');
      setNewFriendEmail('');
      fetchSentFriendRequests();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to send request.';
      toast.error(msg);
    }
  };

  const handleRespondToRequest = async (request_id, action) => {
    try {
      await apiService.respondToFriendRequest(request_id, action);
      toast.success(`${action === 'accept' ? 'Accepted' : 'Rejected'} successfully!`);
      fetchFriendRequests();
      if (action === 'accept') {
        fetchFriends();
      }
    } catch (err) {
      toast.error('Could not respond to friend request.');
    }
  };

  const handleRemoveFriend = async (friend_id) => {
    try {
      await apiService.removeFriend(friend_id);
      toast.success('Friend removed successfully!');
      fetchFriends();
    } catch (err) {
      toast.error('Failed to remove friend.');
    }
  };

  const handleCancelFriendRequest = async (request_id) => {
    try {
      await apiService.cancelFriendRequest(request_id);
      toast.success('Friend request canceled successfully!');
      fetchSentFriendRequests();
    } catch (err) {
      toast.error('Failed to cancel friend request.');
    }
  };

  if (!userInfo) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="container mt-4">
      <Header />
      <div className="profile-info mb-4">
        <p>
          <strong>Name:</strong> {userInfo.name}
        </p>
        <p>
          <strong>Email:</strong> {userInfo.email}
        </p>
      </div>
      <hr />
      <section className="manage-friends mb-4">
        <h4>Manage Friends</h4>
        <div className="mb-3">
          <label htmlFor="friendEmail" className="form-label">
            Send Friend Request
          </label>
          <div className="input-group">
            <input
              type="email"
              id="friendEmail"
              placeholder="Friend's email"
              value={newFriendEmail}
              onChange={(e) => setNewFriendEmail(e.target.value)}
              className="form-control"
            />
            <button className="btn btn-primary" onClick={handleSendFriendRequest}>
              Send
            </button>
          </div>
        </div>
        <div className="mb-3">
          <h5>Incoming Friend Requests</h5>
          {friendRequests.length > 0 ? (
            friendRequests.map((req) => (
              <div
                key={req.id}
                className="mb-2 p-2 border rounded d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{req.Sender?.name}</strong> ({req.Sender?.email}) wants to be your friend.
                </div>
                <div>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={() => handleRespondToRequest(req.id, 'accept')}
                  >
                    Accept
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRespondToRequest(req.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No incoming friend requests.</p>
          )}
        </div>
        <div className="mb-3">
          <h5>Sent Friend Requests</h5>
          {sentFriendRequests.length > 0 ? (
            sentFriendRequests.map((req) => (
              <div
                key={req.id}
                className="mb-2 p-2 border rounded d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{req.Receiver?.name}</strong> ({req.Receiver?.email})
                  <span className="ms-2 badge bg-secondary">{req.status}</span>
                </div>
                <div>
                  {!req.status && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancelFriendRequest(req.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No sent friend requests.</p>
          )}
        </div>
        <div className="mb-3">
          <h5>My Friends</h5>
          {friends.length > 0 ? (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="mb-2 p-2 border rounded d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{friend.name}</strong> ({friend.email})
                </div>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => handleRemoveFriend(friend.id)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p>You have no friends yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
