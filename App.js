import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Modal,
  Alert,
  StatusBar,
  Switch,
  Clipboard 
} from 'react-native';

export default function App() {
  // Navigation State ('flights' oder 'settings')
  const [activeTab, setActiveTab] = useState('flights');

  // Haupt-States
  const [flights, setFlights] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);
  
  // Backup-Modal State
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupInputText, setBackupInputText] = useState('');

  // Einstellungs-States
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filter-States
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Formular-States
  const [flightDate, setFlightDate] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightInfo, setFlightInfo] = useState('');

  // Refs für Auto-Fokus / Loop
  const filterEndRef = useRef(null);
  const flightNumberRef = useRef(null);
  const flightInfoRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedFlights = []; 
      if (savedFlights && savedFlights.length > 0) {
        setFlights(savedFlights);
      }
    } catch (error) {
      Alert.alert("Fehler", "Daten konnten nicht geladen werden.");
    }
  };

  const saveData = async (updatedFlights) => {
    try {
      setFlights(updatedFlights);
    } catch (error) {
      Alert.alert("Fehler", "Daten konnten nicht gespeichert werden.");
    }
  };

  const parseDateString = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return new Date(0);
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  // 1) NEUER ALGORITHMUS: Feste Zuweisung + Hochgradig variabler Fallback
  const getAirlineColor = (flightNum) => {
    if (!flightNum || flightNum.trim().length === 0) {
      return isDarkMode ? '#60a5fa' : '#1e3a8a';
    }
    
    // Extrahiere die ersten 2 Zeichen (z.B. "LH", "SQ", "K+")
    const cleanStr = flightNum.toUpperCase().replace(/\s+/g, '');
    const prefix = cleanStr.slice(0, 2);

    // FIX: Feste, klar unterscheidbare Pastellfarben für deine Haupt-Airlines
    const fixedColors = {
      'LH': isDarkMode ? '#f87171' : '#dc2626', // Kräftiges Pastell-Rot
      'SQ': isDarkMode ? '#34d399' : '#059669', // Kräftiges Pastell-Grün
      'AI': isDarkMode ? '#60a5fa' : '#2563eb', // Schönes Pastell-Blau
      'K+': isDarkMode ? '#c084fc' : '#9333ea', // Sattes Pastell-Lila
      'DE': isDarkMode ? '#fbbf24' : '#d97706', // Pastell-Orange/Gelb
      'EW': isDarkMode ? '#f472b6' : '#db2777', // Pastell-Pink
    };

    // Wenn der Präfix fest definiert ist, nimm die Farbe direkt
    if (fixedColors[prefix]) {
      return fixedColors[prefix];
    }

    // FALLBACK für alle anderen Airlines: Generiert weit gestreute Hues
    let hash = 0;
    for (let i = 0; i < prefix.length; i++) {
      // Nutze Primzahlen zur maximalen Streuung naheliegender Buchstaben
      hash = prefix.charCodeAt(i) + ((hash << 7) - hash);
    }

    // Berechne den Farbkreis-Faktor (0 - 360 Grad)
    const hue = Math.abs(hash * 139) % 360; 
    const saturation = isDarkMode ? '85%' : '75%';
    const lightness = isDarkMode ? '65%' : '42%'; 

    return `hsl(${hue}, ${saturation}, ${lightness})`;
  };

  // Backup in die Zwischenablage kopieren
  const handleExportBackup = () => {
    if (flights.length === 0) {
      Alert.alert("Backup", "Keine Flüge zum Sichern vorhanden.");
      return;
    }
    try {
      const backupData = JSON.stringify(flights);
      Clipboard.setString(backupData);
      Alert.alert("Erfolgreich", "Backup-Text wurde in die Zwischenablage kopiert!");
    } catch (error) {
      Alert.alert("Fehler", "Kopieren fehlgeschlagen.");
    }
  };

  // Backup aus der Zwischenablage einlesen
  const handleImportBackup = () => {
    setBackupInputText('');
    setBackupModalVisible(true);
  };

  const saveImportedBackup = () => {
    if (!backupInputText.trim()) {
      Alert.alert("Fehler", "Bitte füge zuerst den Backup-Text ein.");
      return;
    }
    try {
      const parsed = JSON.parse(backupInputText.trim());
      if (Array.isArray(parsed)) {
        saveData(parsed);
        setBackupModalVisible(false);
        Alert.alert("Erfolgreich", `${parsed.length} Flüge wurden erfolgreich importiert!`);
      } else {
        Alert.alert("Fehler", "Ungültiges Backup-Format.");
      }
    } catch (e) {
      Alert.alert("Fehler", "Der eingegebene Text ist kein gültiges Flug-Backup.");
    }
  };

  // Formatierung & Loop für das Eintragen-Datumsfeld
  const handleDateChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
    }
    setFlightDate(formatted);

    if (cleaned.length === 8) {
      flightNumberRef.current?.focus();
    }
  };

  // Formatierung & Auto-Loop für die Filter-Eingabefelder
  const handleFilterStartChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
    }
    setFilterStart(formatted);

    if (cleaned.length === 8) {
      filterEndRef.current?.focus();
    }
  };

  const handleFilterEndChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
    }
    setFilterEnd(formatted);
  };

  // Flug hinzufügen oder editieren
  const saveFlightForm = () => {
    if (flightDate.length !== 10 || !flightNumber) {
      Alert.alert("Fehler", "Bitte fülle mindestens Datum und Flugnummer aus.");
      return;
    }

    let updatedFlights;
    const finalInfo = flightInfo.trim() || "Keine Zusatzinfos"; 

    if (editingFlightId) {
      updatedFlights = flights.map(flight => {
        if (flight.id === editingFlightId) {
          return { ...flight, date: flightDate, flightNumber, info: finalInfo };
        }
        return flight;
      });
    } else {
      const newFlight = {
        id: Date.now().toString(),
        date: flightDate,
        flightNumber,
        info: finalInfo,
        timestamp: Date.now()
      };
      updatedFlights = [...flights, newFlight];
    }
    
    updatedFlights.sort((a, b) => {
      const dateA = parseDateString(a.date).getTime();
      const dateB = parseDateString(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.timestamp - a.timestamp;
    });

    saveData(updatedFlights);

    setFlightDate('');
    setFlightNumber('');
    setFlightInfo('');
    setEditingFlightId(null);
    setModalVisible(false);
  };

  const startEditFlight = (flight) => {
    setEditingFlightId(flight.id);
    setFlightDate(flight.date);
    setFlightNumber(flight.flightNumber);
    setFlightInfo(flight.info === "Keine Zusatzinfos" ? "" : flight.info);
    setModalVisible(true);
  };

  const confirmDeleteFlight = (flight) => {
    Alert.alert(
      "Eintrag löschen",
      `Möchtest du den Flug ${flight.flightNumber} wirklich löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          onPress: () => {
            const updatedFlights = flights.filter(f => f.id !== flight.id);
            saveData(updatedFlights);
          },
          style: "destructive"
        }
      ]
    );
  };

  // Filter-Logik
  const filteredFlights = flights.filter(flight => {
    const flightTime = parseDateString(flight.date).getTime();
    if (filterStart.length === 10) {
      const startTime = parseDateString(filterStart).getTime();
      if (flightTime < startTime) return false;
    }
    if (filterEnd.length === 10) {
      const endTime = parseDateString(filterEnd).getTime();
      if (flightTime > endTime) return false;
    }

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const matchNumber = flight.flightNumber.toLowerCase().includes(query);
      const matchInfo = flight.info.toLowerCase().includes(query);
      if (!matchNumber && !matchInfo) return false;
    }

    return true;
  });

  const themeContainer = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const themeCard = isDarkMode ? styles.darkCard : styles.lightCard;
  const themeText = isDarkMode ? styles.darkText : styles.lightText;
  const themeSubText = isDarkMode ? styles.darkSubText : styles.lightSubText;
  const themeInput = isDarkMode ? styles.darkInput : styles.lightInput;
  const themePanel = isDarkMode ? styles.darkPanel : styles.lightPanel;

  return (
    <SafeAreaView style={[styles.container, themeContainer]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={styles.headerTitle}>Flugorganisation</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, isDarkMode && styles.darkTabBar]}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'flights' && styles.activeTabItem]} 
          onPress={() => setActiveTab('flights')}
        >
          <Text style={[styles.tabText, activeTab === 'flights' && styles.activeTabText, isDarkMode && styles.darkTabTextShared]}>Flüge</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'settings' && styles.activeTabItem]} 
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText, isDarkMode && styles.darkTabTextShared]}>Einstellungen</Text>
        </TouchableOpacity>
      </View>

      {/* TABS 1: FLÜGE */}
      {activeTab === 'flights' && (
        <>
          <View style={[styles.filterContainer, themePanel]}>
            <TextInput 
              style={[styles.searchBar, themeInput]}
              placeholder="Flugnummer oder Text suchen (z.B. SQ)..."
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
            />

            <Text style={[styles.filterTitle, themeText]}>Zeitraum filtern (TTMMJJJJ):</Text>
            <View style={styles.filterInputRow}>
              <TextInput 
                style={[styles.filterInput, themeInput]}
                placeholder="Von"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                keyboardType="numeric"
                maxLength={10}
                value={filterStart}
                onChangeText={handleFilterStartChange}
              />
              <TextInput 
                ref={filterEndRef}
                style={[styles.filterInput, themeInput]}
                placeholder="Bis"
                placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
                keyboardType="numeric"
                maxLength={10}
                value={filterEnd}
                onChangeText={handleFilterEndChange}
              />
            </View>
            {(filterStart.length > 0 || filterEnd.length > 0 || searchQuery.length > 0) && (
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => { setFilterStart(''); setFilterEnd(''); setSearchQuery(''); }}
              >
                <Text style={styles.clearFilterText}>Filter komplett löschen</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.listContainer}>
            {filteredFlights.length === 0 ? (
              <Text style={[styles.emptyText, themeSubText]}>Keine Flüge gefunden.</Text>
            ) : (
              filteredFlights.map((item) => {
                const airlineColor = getAirlineColor(item.flightNumber);

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.flightCard, themeCard, { borderLeftColor: airlineColor }]}
                    onPress={() => startEditFlight(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.flightNumberText, { color: airlineColor }]}>
                          {item.flightNumber}
                        </Text>
                        <Text style={[styles.flightDateText, themeSubText]}>{item.date}</Text>
                      </View>
                      <Text style={[styles.detailText, themeText]} numberOfLines={1} elipsizeMode="tail">
                        {item.info}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.miniDeleteButton} 
                      onPress={() => confirmDeleteFlight(item)}
                    >
                      <Text style={styles.miniDeleteButtonText}>×</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.fab, isDarkMode && styles.darkFab]} 
            onPress={() => {
              setEditingFlightId(null);
              setModalVisible(true);
            }}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}

      {/* TAB 2: EINSTELLUNGEN */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.settingsContainer}>
          <View style={[styles.settingsSection, themePanel]}>
            <Text style={[styles.sectionTitle, themeText]}>Entwicklerinformationen</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, themeSubText]}>Entwickler:</Text>
              <Text style={[styles.infoValue, themeText]}>Özgür Cetin</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, themeSubText]}>E-Mail:</Text>
              <Text style={[styles.infoValue, themeText, styles.emailText]}>ozgur.cetin@web.de</Text>
            </View>
          </View>

          <View style={[styles.settingsSection, styles.rowSection, themePanel]}>
            <View>
              <Text style={[styles.sectionTitle, themeText, { marginBottom: 2 }]}>Darkmodus</Text>
              <Text style={[styles.infoLabel, themeSubText]}>Dunkles Design aktivieren</Text>
            </View>
            <Switch 
              value={isDarkMode} 
              onValueChange={setIsDarkMode}
              trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
              thumbColor={isDarkMode ? '#ffffff' : '#f3f4f6'}
            />
          </View>

          <View style={[styles.settingsSection, themePanel]}>
            <Text style={[styles.sectionTitle, themeText]}>Backup & Datensicherung</Text>
            <Text style={[styles.infoLabel, themeSubText, { marginBottom: 12 }]}>
              Kopiere deine Daten als Text in die Zwischenablage oder füge ein altes Backup ein.
            </Text>
            <View style={styles.backupButtonRow}>
              <TouchableOpacity style={[styles.backupButton, styles.exportBtn]} onPress={handleExportBackup}>
                <Text style={styles.backupButtonText}>In Zwischenablage kopieren</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.backupButton, styles.importBtn]} onPress={handleImportBackup}>
                <Text style={[styles.backupButtonText, { color: '#4b5563' }]}>Aus Zwischenablage laden</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Haupt-Modal (Eintragen / Bearbeiten) */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkPanel : styles.lightPanel]}>
            <Text style={[styles.modalTitle, isDarkMode ? styles.darkText : { color: '#1e3a8a' }]}>
              {editingFlightId ? "Flug bearbeiten" : "Neuen Flug eintragen"}
            </Text>

            <Text style={[styles.inputLabel, themeText]}>Datum (TTMMJJJJ):</Text>
            <TextInput 
              style={[styles.input, themeInput]} 
              placeholder="z.B. 20062026" 
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              keyboardType="numeric"
              maxLength={10}
              value={flightDate}
              onChangeText={handleDateChange}
            />

            <Text style={[styles.inputLabel, themeText]}>Flugnummer:</Text>
            <TextInput 
              ref={flightNumberRef}
              style={[styles.input, themeInput]} 
              placeholder="z.B. LH456" 
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              autoCapitalize="characters"
              value={flightNumber}
              onChangeText={setFlightNumber}
              returnKeyType="next"
              onSubmitEditing={() => flightInfoRef.current?.focus()}
            />

            <Text style={[styles.inputLabel, themeText]}>Zusatz-Infos (Optional):</Text>
            <TextInput 
              ref={flightInfoRef}
              style={[styles.input, themeInput]} 
              placeholder="Kein Zwang - z.B. Gate B22" 
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={flightInfo}
              onChangeText={setFlightInfo}
              returnKeyType="done"
              onSubmitEditing={saveFlightForm}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonCancel, isDarkMode && styles.darkCancelBtn]} 
                onPress={() => {
                  setModalVisible(false);
                  setFlightDate('');
                  setFlightNumber('');
                  setFlightInfo('');
                  setEditingFlightId(null);
                }}
              >
                <Text style={[styles.buttonTextCancel, isDarkMode && styles.darkText]}>Abbrechen</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.buttonSave, isDarkMode && styles.darkFab]} onPress={saveFlightForm}>
                <Text style={styles.buttonTextSave}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Backup-Import Modal */}
      <Modal animationType="fade" transparent={true} visible={backupModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkPanel : styles.lightPanel]}>
            <Text style={[styles.modalTitle, themeText]}>Backup einfügen</Text>
            <Text style={[styles.inputLabel, themeSubText, { marginBottom: 8 }]}>
              Halte das Textfeld gedrückt, um den kopierten Backup-Code einzufügen:
            </Text>
            <TextInput
              style={[styles.input, themeInput, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Hier den Text gedrückt halten & einfügen..."
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              multiline={true}
              value={backupInputText}
              onChangeText={setBackupInputText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonCancel, isDarkMode && styles.darkCancelBtn]} 
                onPress={() => setBackupModalVisible(false)}
              >
                <Text style={[styles.buttonTextCancel, isDarkMode && styles.darkText]}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.buttonSave, isDarkMode && styles.darkFab]} 
                onPress={saveImportedBackup}
              >
                <Text style={styles.buttonTextSave}>Wiederherstellen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  lightContainer: { backgroundColor: '#f4f5f7' },
  darkContainer: { backgroundColor: '#0f172a' },
  lightPanel: { backgroundColor: '#ffffff' },
  darkPanel: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
  lightCard: { backgroundColor: '#ffffff' },
  darkCard: { backgroundColor: '#1e293b' },
  lightText: { color: '#1f2937' },
  darkText: { color: '#f8fafc' },
  lightSubText: { color: '#6b7280' },
  darkSubText: { color: '#94a3b8' },
  lightInput: { backgroundColor: '#f9fafb', borderColor: '#d1d5db', color: '#1f2937' },
  darkInput: { backgroundColor: '#334155', borderColor: '#475569', color: '#f8fafc' },
  header: { padding: 16, backgroundColor: '#1e3a8a' },
  darkHeader: { backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  darkTabBar: { backgroundColor: '#1e293b', borderBottomColor: '#334155' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTabItem: { borderBottomWidth: 3, borderBottomColor: '#3b82f6' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  activeTabText: { color: '#3b82f6' },
  darkTabTextShared: { color: '#94a3b8' },
  filterContainer: { padding: 10 },
  searchBar: { borderWidth: 1, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, fontSize: 14, marginBottom: 8 },
  filterTitle: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  filterInputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterInput: { width: '48%', borderWidth: 1, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, fontSize: 13, textAlign: 'center' },
  clearFilterButton: { marginTop: 6, alignItems: 'center' },
  clearFilterText: { color: '#ef4444', fontSize: 12, fontWeight: '500' },
  listContainer: { flex: 1, padding: 10 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  flightCard: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 5, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 1 },
  cardContent: { flex: 1, paddingRight: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  flightNumberText: { fontSize: 15, fontWeight: 'bold', width: 90 },
  flightDateText: { fontSize: 13, fontWeight: '500' },
  detailText: { fontSize: 13 },
  miniDeleteButton: { padding: 6, justifyContent: 'center', alignItems: 'center' },
  miniDeleteButtonText: { fontSize: 22, color: '#9ca3af', fontWeight: '300', lineHeight: 22 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1e3a8a', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  darkFab: { backgroundColor: '#3b82f6' },
  fabText: { color: '#ffffff', fontSize: 26, fontWeight: '300' },
  settingsContainer: { flex: 1, padding: 12 },
  settingsSection: { borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#ffffff' },
  rowSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8, color: '#3b82f6' },
  infoRow: { flexDirection: 'row', paddingVertical: 4 },
  infoLabel: { width: 100, fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '500' },
  emailText: { color: '#3b82f6', textDecorationLine: 'underline' },
  backupButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  backupButton: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center', marginHorizontal: 4 },
  exportBtn: { backgroundColor: '#3b82f6' },
  importBtn: { backgroundColor: '#e5e7eb' },
  backupButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2, marginTop: 6 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  button: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center', marginHorizontal: 4 },
  buttonCancel: { backgroundColor: '#f3f4f6' },
  darkCancelBtn: { backgroundColor: '#475569' },
  buttonSave: { backgroundColor: '#1e3a8a' },
  buttonTextCancel: { color: '#4b5563', fontWeight: '600' },
  buttonTextSave: { color: '#ffffff', fontWeight: '600' },
});

