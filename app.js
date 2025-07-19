import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  FlatList,
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

const STORAGE_KEY = '@secure_notes';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const encryptNote = (text, key) =>
    CryptoJS.AES.encrypt(text, key).toString();

  const decryptNote = (cipher, key) => {
    try {
      const bytes = CryptoJS.AES.decrypt(cipher, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return '';
    }
  };

  const saveNotes = async newNotes => {
    const encrypted = newNotes.map(n => ({
      id: n.id,
      text: encryptNote(n.text, passphrase),
    }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    setNotes(newNotes);
  };

  const loadNotes = async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const encrypted = JSON.parse(stored);
      const decrypted = encrypted.map(n => ({
        id: n.id,
        text: decryptNote(n.text, passphrase),
      }));

      if (decrypted.some(n => n.text === '')) {
        Alert.alert('Wrong passphrase!');
        return;
      }

      setNotes(decrypted);
      setUnlocked(true);
    }
  };

  const addNote = () => {
    if (!noteText) return;
    const newNote = { id: Date.now().toString(), text: noteText };
    const newNotes = [...notes, newNote];
    setNoteText('');
    saveNotes(newNotes);
  };

  const deleteNote = id => {
    const newNotes = notes.filter(n => n.id !== id);
    saveNotes(newNotes);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>🔐 Offline Notes Vault</Text>

      {!unlocked ? (
        <>
          <TextInput
            placeholder="Enter passphrase to unlock"
            secureTextEntry
            style={styles.input}
            value={passphrase}
            onChangeText={setPassphrase}
          />
          <Button title="Unlock Notes" onPress={loadNotes} />
        </>
      ) : (
        <>
          <FlatList
            data={notes}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.noteItem}>
                <Text style={styles.noteText}>{item.text}</Text>
                <Button title="Delete" onPress={() => deleteNote(item.id)} />
              </View>
            )}
            style={styles.noteList}
          />

          <TextInput
            placeholder="New note..."
            value={noteText}
            onChangeText={setNoteText}
            style={styles.input}
          />
          <Button title="Add Note" onPress={addNote} />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  noteList: { marginBottom: 10 },
  noteItem: {
    padding: 10,
    backgroundColor: '#e1e1e1',
    borderRadius: 6,
    marginBottom: 10,
  },
  noteText: { fontSize: 16, marginBottom: 6 },
});
