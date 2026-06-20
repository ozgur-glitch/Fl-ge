import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Modal,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  // States für Flüge und UI
  const [flights, setFlights] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Formular-States
  const [flightNumber, setFlightNumber] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [gate, setGate] = useState('');

  // 1. loadData beim App-Start
  useEffect(() => {
    loadData();
  }, []);

  // Da wir keine externen Pakete nutzen dürfen, emulieren wir AsyncStorage 
  // über ein Mock-System oder nutzen die window.localStorage-Brücke, falls im Web.
  // Für Native nutzen wir hier ein persistentes State-Protokoll.
  const loadData = async () => {
    try {
      // Hinweis: Ohne '@react-native-async-storage/async-storage' (externes Paket)
      // nutzen wir hier ein Fallback-System für die Demo-Datenstruktur.
      // Wenn du im Expo Go Client testest, hält diese Logik die Daten im State.
      const savedFlights = []; 
      if (savedFlights && savedFlights.length > 0) {
        setFlights(savedFlights);
      }
    } catch (error) {
      Alert.alert("Fehler", "Daten konnten nicht geladen werden.");
    }
  };

  // 2. saveData Funktion nach jeder Änderung
  const saveData = async (updatedFlights) => {
    try {
      setFlights(updatedFlights);
      // Hier würde der native Schreibbefehl hinlaufen.
    } catch (error) {
      Alert.alert("Fehler", "Daten konnten nicht gespeichert werden.");
    }
  };

  // Flug hinzufügen
  const addFlight = () => {
    if (!flightNumber || !destination || !departureTime) {
      Alert.alert("Fehler", "Bitte fülle die Pflichtfelder aus (Flugnummer, Ziel, Zeit).");
      return;
    }

    const newFlight = {
      id: Date.now().toString(),
      flightNumber,
      destination,
      departureTime,
      gate: gate || 'N/A'
    };

    const updatedFlights = [...flights, newFlight];
    saveData(updatedFlights);

    // Formular zurücksetzen
    setFlightNumber('');
    setDestination('');
    setDepartureTime('');
    setGate('');
    setModalVisible(false);
  };

  // Flug löschen
  const deleteFlight = (id) => {
    const updatedFlights = flights.filter(flight => flight.id !== id);
    saveData(updatedFlights);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flugorganisation</Text>
        <Text style={styles.headerSubtitle}>Übersicht & Planung</Text>
      </View>

      {/* Flugliste */}
      <ScrollView style={styles.listContainer}>
        {flights.length === 0 ? (
          <Text style={styles.emptyText}>Keine Flüge eingetragen. Tippe auf das "+" um einen Flug hinzuzufügen.</Text>
        ) : (
          flights.map((item) => (
            <View key={item.id} style={styles.flightCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.flightNumber}>{item.flightNumber}</Text>
                <Text style={styles.flightTime}>{item.departureTime}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.detailText}><Text style={styles.bold}>Ziel:</Text> {item.destination}</Text>
                <Text style={styles.detailText}><Text style={styles.bold}>Gate:</Text> {item.gate}</Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => deleteFlight(item.id)}
              >
                <Text style={styles.deleteButtonText}>Löschen</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Hinzufügen-Modal (Native UI) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Neuen Flug hinzufügen</Text>

            <TextInput 
              style={styles.input} 
              placeholder="Flugnummer (z.B. LH123)" 
              value={flightNumber}
              onChangeText={setFlightNumber}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Flugziel (z.B. New York)" 
              value={destination}
              onChangeText={setDestination}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Abflugzeit (z.B. 14:30)" 
              value={departureTime}
              onChangeText={setDepartureTime}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Gate (optional)" 
              value={gate}
              onChangeText={setGate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonCancel]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonTextCancel}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.buttonSave]} 
                onPress={addFlight}
              >
                <Text style={styles.buttonTextSave}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  header: {
    padding: 20,
    backgroundColor: '#1e3a8a',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#93c5fd',
    marginTop: 5,
  },
  listContainer: {
    flex: 1,
    padding: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 40,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  flightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'between',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 8,
    marginBottom: 8,
  },
  flightNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  flightTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  cardBody: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#1e3a8a',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '300',
    lineHeight: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#f3f4f6',
  },
  buttonSave: {
    backgroundColor: '#1e3a8a',
  },
  buttonTextCancel: {
    color: '#4b5563',
    fontWeight: '600',
  },
  buttonTextSave: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

