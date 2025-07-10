import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import {
  fetchChatSessions,
  createChatSession,
  sendChatMessage,
  setCurrentSession,
  ChatSession,
  ChatMessage,
} from '../../store/chatSlice';
import { selectAvailableAgents } from '../../store/agentsSlice';

const Chat: React.FC = () => {
  const dispatch = useDispatch();
  const chatState = useSelector((state: RootState) => state.chat);
  const availableAgents = useSelector(selectAvailableAgents);
  
  const { sessions, currentSession, loading } = chatState as any;
  
  const [message, setMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const [conversationTitle, setConversationTitle] = useState('');
  const [conversationAgentId, setConversationAgentId] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchChatSessions() as any);
  }, [dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (message.trim() && currentSession) {
      dispatch(sendChatMessage({
        sessionId: currentSession.id,
        content: message.trim(),
        agent_id: selectedAgentId || undefined,
      }) as any);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateConversation = () => {
    if (conversationTitle.trim()) {
      dispatch(createChatSession({
        title: conversationTitle,
        agent_id: conversationAgentId || undefined,
      }) as any);
      setNewConversationDialogOpen(false);
      setConversationTitle('');
      setConversationAgentId('');
    }
  };

  const handleConversationSelect = (conversation: ChatSession) => {
    dispatch(setCurrentSession(conversation) as any);
    setSelectedAgentId(conversation.agent_id || '');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const agent = availableAgents.find((a) => a.id === message.agent_id);
    
    return (
      <ListItem key={message.id} sx={{ alignItems: 'flex-start' }}>
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: isUser ? 'primary.main' : 'secondary.main' }}>
            {isUser ? <PersonIcon /> : <BotIcon />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {isUser ? 'You' : (agent?.name || 'AI Assistant')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          }
          secondary={
            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          }
        />
      </ListItem>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Conversations Sidebar */}
      <Paper sx={{ width: 300, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Conversations</Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setNewConversationDialogOpen(true)}
              size="small"
            >
              New
            </Button>
          </Box>
        </Box>
        
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {sessions?.map((session: ChatSession) => (
            <ListItem
              key={session.id}
              button
              selected={currentSession?.id === session.id}
              onClick={() => handleConversationSelect(session)}
            >
              <ListItemText
                primary={session.title}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption">
                      {new Date(session.updated_at).toLocaleDateString()}
                    </Typography>
                    {session.agent_id && (
                      <Chip
                        label={availableAgents.find((a) => a.id === session.agent_id)?.name || 'Agent'}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Chat Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {currentSession ? (
          <>
            {/* Chat Header */}
            <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">{currentSession.title}</Typography>
                  {currentSession.agent_id && (
                    <Chip
                      label={availableAgents.find((a) => a.id === currentSession.agent_id)?.name || 'Agent'}
                      size="small"
                      color="primary"
                    />
                  )}
                </Box>
                <IconButton onClick={handleMenuOpen}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Paper>

            {/* Messages */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
              <List>
                {currentSession.messages?.map(renderMessage)}
                <div ref={messagesEndRef} />
              </List>
            </Box>

            {/* Message Input */}
            <Paper sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Agent</InputLabel>
                  <Select
                    value={selectedAgentId}
                    label="Agent"
                    onChange={(e: SelectChangeEvent) => setSelectedAgentId(e.target.value)}
                  >
                    <MenuItem value="">No Agent</MenuItem>
                    {availableAgents.map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || loading}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Paper>
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            gap: 2
          }}>
            <BotIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start chatting
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setNewConversationDialogOpen(true)}
            >
              Start New Conversation
            </Button>
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <SettingsIcon sx={{ mr: 1 }} />
          Settings
        </MenuItem>
      </Menu>

      {/* New Conversation Dialog */}
      <Dialog 
        open={newConversationDialogOpen} 
        onClose={() => setNewConversationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Conversation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Conversation Title"
              value={conversationTitle}
              onChange={(e) => setConversationTitle(e.target.value)}
            />
            <FormControl fullWidth>
              <InputLabel>Default Agent</InputLabel>
              <Select
                value={conversationAgentId}
                label="Default Agent"
                onChange={(e) => setConversationAgentId(e.target.value)}
              >
                <MenuItem value="">No Agent</MenuItem>
                {availableAgents.map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewConversationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateConversation} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Chat;
