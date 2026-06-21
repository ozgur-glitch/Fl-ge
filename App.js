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

// Sicherer Import-Versuch ohne Terminal-Zwang mit erweitertem persistentem Web-Fallback
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  try {
    AsyncStorage = require('react-native').AsyncStorage;
  } catch (err) {
    AsyncStorage = null;
  }
}

// Sicheres Fallback-System für Umgebungen ohne installierte NPM-Pakete (z.B. Web-Vorschauen/Browser)
const robustStorage = {
  getItem: async (key) => {
    try {
      if (AsyncStorage) {
        return await AsyncStorage.getItem(key);
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {
      console.log('Fehler beim Lesen:', e);
    }
    return null;
  },
  setItem: async (key, value) => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem(key, value);
        return;
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {
      console.log('Fehler beim Schreiben:', e);
    }
  }
};

const storage = robustStorage;

// ==========================================
// DEINE MANUELLE FARBLISTE (HIER ANPASSEN!)
// ==========================================
const AIRLINE_COLORS = {
  light: {
    'LH': '#dc2626',   // Lufthansa -> Rot
    'SQ': '#059669',   // Singapore Airlines -> Grün
    'AI': '#2563eb',   // Air India -> Blau
    'AC': '#ea580c',   // Air Canada -> Orange
    'ET': '#d97706',   // Ethiopian -> Gelb/Braun
    'K+': '#9333ea',   // K+N -> Lila
    'LA': '#db2777',   // LATAM -> Pink
    'AH': '#4b5563',   // Air Algérie -> Grau
    'UC': '#0d9488',   // Ladeco -> Türkis
  },
  dark: {
    'LH': '#f87171',
    'SQ': '#34d399',
    'AI': '#60a5fa',
    'AC': '#fb923c',
    'ET': '#fbbf24',
    'K+': '#c084fc',
    'LA': '#f472b6',
    'AH': '#9ca3af',
    'UC': '#2dd4bf',
  }
};

const WEEKDAYS = [
  { id: 1, label: '1' },
  { id: 2, label: '2' },
  { id: 3, label: '3' },
  { id: 4, label: '4' },
  { id: 5, label: '5' },
  { id: 6, label: '6' },
  { id: 7, label: '7' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('flights');

  // Ad-Hoc-Flüge States
  const [flights, setFlights] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [hideCompletedFlights, setHideCompletedFlights] = useState(false);

  // Flugplan States
  const [schedules, setSchedules] = useState([]);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  
  // Sortierungs- & Filter-States für Flugplan
  const [scheduleSortBy, setScheduleSortBy] = useState('startDate'); 
  const [hideCompletedSchedules, setHideCompletedSchedules] = useState(false);

  // Formular-States für Flugplan
  const [schedFlightNumber, setSchedFlightNumber] = useState('');
  const [schedStartDate, setSchedStartDate] = useState('');
  const [schedEndDate, setSchedEndDate] = useState('');
  const [schedSTD, setSchedSTD] = useState('');
  const [schedSTA, setSchedSTA] = useState('');
  const [schedDays, setSchedDays] = useState([]); 
  const [schedStatus, setSchedStatus] = useState('active'); 

  // Sonstige States
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupInputText, setBackupInputText] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Formular-States für Ad-Hoc
  const [flightDate, setFlightDate] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [flightInfo, setFlightInfo] = useState('');
  const [flightStatus, setFlightStatus] = useState('active');

  // Refs
  const filterEndRef = useRef(null);
  const flightNumberRef = useRef(null);
  const flightInfoRef = useRef(null);
  const schedStartDateRef = useRef(null);
  const schedEndDateRef = useRef(null);
  const schedSTDRef = useRef(null);
  const schedSTARef = useRef(null);

  // ==========================================
  // PERSISTENZ LOGIKEN (LOAD / SAVE)
  // ==========================================
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const storedFlights = await storage.getItem('@flights_storage_key');
      const storedSchedules = await storage.getItem('@schedules_storage_key');
      const storedDarkMode = await storage.getItem('@darkmode_storage_key');

      if (storedFlights) {
        setFlights(JSON.parse(storedFlights));
      }
      if (storedSchedules) {
        setSchedules(JSON.parse(storedSchedules));
      }
      if (storedDarkMode !== null && storedDarkMode !== undefined) {
        setIsDarkMode(JSON.parse(storedDarkMode) === true);
      }
    } catch (error) {
      console.log('Fehler beim Laden der Daten:', error);
    }
  };

  const saveData = async (updatedFlights, updatedSchedules, updatedDarkMode) => {
    try {
      if (updatedFlights !== undefined && updatedFlights !== null) {
        await storage.setItem('@flights_storage_key', JSON.stringify(updatedFlights));
      }
      if (updatedSchedules !== undefined && updatedSchedules !== null) {
        await storage.setItem('@schedules_storage_key', JSON.stringify(updatedSchedules));
      }
      if (updatedDarkMode !== undefined && updatedDarkMode !== null) {
        await storage.setItem('@darkmode_storage_key', JSON.stringify(updatedDarkMode));
      }
    } catch (error) {
      console.log('Fehler beim Speichern der Daten:', error);
    }
  };

  const parseDateString = (dateStr) => {
    if (!dateStr || dateStr.length !== 10) return new Date(0);
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  const getAirlineColor = (flightNum) => {
    if (!flightNum || flightNum.trim().length === 0) return isDarkMode ? '#60a5fa' : '#1e3a8a';
    const cleanStr = flightNum.toUpperCase().replace(/\s+/g, '');
    const match = cleanStr.match(/^[A-Z+|]+/);
    const prefix = match ? match[0] : cleanStr.slice(0, 2);
    const mode = isDarkMode ? 'dark' : 'light';
    if (AIRLINE_COLORS[mode] && AIRLINE_COLORS[mode][prefix]) return AIRLINE_COLORS[mode][prefix];
    let hash = 0;
    for (let i = 0; i < prefix.length; i++) hash = prefix.charCodeAt(i) + ((hash << 5) - hash);
    return `hsl(${Math.abs(hash) % 360}, ${isDarkMode ? '85%' : '70%'}, ${isDarkMode ? '65%' : '40%'})`;
  };

  const formatFormatDate = (text, nextRef) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    else if (cleaned.length > 4) formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 4)}.${cleaned.slice(4, 8)}`;
    if (cleaned.length === 8 && nextRef) nextRef.current?.focus();
    return formatted;
  };

  const formatTimeInput = (text, nextRef) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    if (cleaned.length === 4 && nextRef) nextRef.current?.focus();
    return formatted;
  };

  // ==========================================
  // BACKUP LOGIKEN
  // ==========================================
  const handleExportBackup = () => {
    if (flights.length === 0 && schedules.length === 0) {
      Alert.alert("Backup", "Keine Daten zum Sichern vorhanden.");
      return;
    }
    try {
      const allData = { flights, schedules };
      Clipboard.setString(JSON.stringify(allData));
      Alert.alert("Erfolgreich", "Komplett-Backup in die Zwischenablage kopiert!");
    } catch (error) {
      Alert.alert("Fehler", "Kopieren fehlgeschlagen.");
    }
  };

  const saveImportedBackup = () => {
    if (!backupInputText.trim()) {
      Alert.alert("Fehler", "Bitte füge zuerst den Backup-Text ein.");
      return;
    }
    try {
      const parsed = JSON.parse(backupInputText.trim());
      if (parsed.flights || parsed.schedules) {
        if (parsed.flights) {
          setFlights(parsed.flights);
          saveData(parsed.flights, undefined, undefined);
        }
        if (parsed.schedules) {
          setSchedules(parsed.schedules);
          saveData(undefined, parsed.schedules, undefined);
        }
        setBackupModalVisible(false);
        Alert.alert("Erfolgreich", "Daten wurden erfolgreich geladen!");
      } else if (Array.isArray(parsed)) {
        setFlights(parsed);
        saveData(parsed, undefined, undefined);
        setBackupModalVisible(false);
        Alert.alert("Erfolgreich", "Ad-Hoc Flüge importiert!");
      } else {
        Alert.alert("Fehler", "Ungültiges Backup-Format.");
      }
    } catch (e) {
      Alert.alert("Fehler", "Gefundener Text ist kein gültiges Backup.");
    }
  };

  // ==========================================
  // AD-HOC LOGIKEN
  // ==========================================
  const saveFlightForm = () => {
    if (flightDate.length !== 10 || !flightNumber) {
      Alert.alert("Fehler", "Bitte fülle mindestens Datum und Flugnummer aus.");
      return;
    }
    let updatedFlights;
    const finalInfo = flightInfo.trim() || "Keine Zusatzinfos"; 
    if (editingFlightId) {
      updatedFlights = flights.map(f => f.id === editingFlightId ? { ...f, date: flightDate, flightNumber, info: finalInfo, status: flightStatus } : f);
    } else {
      updatedFlights = [...flights, { id: Date.now().toString(), date: flightDate, flightNumber, info: finalInfo, status: flightStatus, timestamp: Date.now() }];
    }
    updatedFlights.sort((a, b) => parseDateString(b.date).getTime() - parseDateString(a.date).getTime());
    setFlights(updatedFlights);
    saveData(updatedFlights, undefined, undefined);
    setFlightDate(''); setFlightNumber(''); setFlightInfo(''); setFlightStatus('active'); setEditingFlightId(null); setModalVisible(false);
  };

  const confirmDeleteFlight = (flight) => {
    Alert.alert("Eintrag löschen", `Flug ${flight.flightNumber} wirklich löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Löschen", onPress: () => {
          const updated = flights.filter(f => f.id !== flight.id);
          setFlights(updated);
          saveData(updated, undefined, undefined);
        }, style: "destructive" }
    ]);
  };

  const startEditFlight = (flight) => {
    setEditingFlightId(flight.id);
    setFlightDate(flight.date);
    setFlightNumber(flight.flightNumber);
    setFlightInfo(flight.info === "Keine Zusatzinfos" ? "" : flight.info);
    setFlightStatus(flight.status || 'active');
    setModalVisible(true);
  };

  const filteredFlights = flights.filter(flight => {
    if (hideCompletedFlights && (flight.status === 'completed')) return false;
    const flightTime = parseDateString(flight.date).getTime();
    if (filterStart.length === 10 && flightTime < parseDateString(filterStart).getTime()) return false;
    if (filterEnd.length === 10 && flightTime > parseDateString(filterEnd).getTime()) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return flight.flightNumber.toLowerCase().includes(q) || flight.info.toLowerCase().includes(q);
    }
    return true;
  });

  // ==========================================
  // FLUGPLAN LOGIKEN
  // ==========================================
  const toggleWeekday = (dayId) => {
    if (schedDays.includes(dayId)) setSchedDays(schedDays.filter(id => id !== dayId));
    else setSchedDays([...schedDays, dayId].sort());
  };

  const saveScheduleForm = () => {
    if (!schedFlightNumber || schedStartDate.length !== 10 || schedEndDate.length !== 10 || schedSTD.length !== 5 || schedSTA.length !== 5 || schedDays.length === 0) {
      Alert.alert("Fehler", "Bitte fülle alle Pflichtfelder inklusive Wochentage aus.");
      return;
    }
    const newSchedule = {
      id: editingScheduleId || Date.now().toString(),
      flightNumber: schedFlightNumber,
      startDate: schedStartDate,
      endDate: schedEndDate,
      std: schedSTD,
      sta: schedSTA,
      days: schedDays,
      status: schedStatus,
      timestamp: Date.now()
    };
    let updatedSchedules = editingScheduleId ? schedules.map(s => s.id === editingScheduleId ? newSchedule : s) : [...schedules, newSchedule];
    setSchedules(updatedSchedules);
    saveData(undefined, updatedSchedules, undefined);
    setSchedFlightNumber(''); setSchedStartDate(''); setSchedEndDate('');
    setSchedSTD(''); setSchedSTA(''); setSchedDays([]); setSchedStatus('active');
    setEditingScheduleId(null); setScheduleModalVisible(false);
  };

  const startEditSchedule = (schedule) => {
    setEditingScheduleId(schedule.id); setSchedFlightNumber(schedule.flightNumber);
    setSchedStartDate(schedule.startDate); setSchedEndDate(schedule.endDate);
    setSchedSTD(schedule.std); setSchedSTA(schedule.sta); setSchedDays(schedule.days);
    setSchedStatus(schedule.status || 'active'); setScheduleModalVisible(true);
  };

  const confirmDeleteSchedule = (schedule) => {
    Alert.alert("Flugplan löschen", `Flugplan für ${schedule.flightNumber} wirklich löschen?`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Löschen", onPress: () => {
          const updated = schedules.filter(s => s.id !== schedule.id);
          setSchedules(updated);
          saveData(undefined, updated, undefined);
        }, style: "destructive" }
    ]);
  };

  const getProcessedSchedules = () => {
    let result = [...schedules];
    if (hideCompletedSchedules) result = result.filter(s => s.status !== 'completed');
    
    result.sort((a, b) => {
      if (scheduleSortBy === 'flightNumber') {
        const numA = (a.flightNumber || '').toUpperCase();
        const numB = (b.flightNumber || '').toUpperCase();
        return numA.localeCompare(numB);
      } else {
        const timeA = parseDateString(scheduleSortBy === 'startDate' ? a.startDate : a.endDate).getTime();
        const timeB = parseDateString(scheduleSortBy === 'startDate' ? b.startDate : b.endDate).getTime();
        return timeB - timeA; 
      }
    });
    return result;
  };

  const getStatusBackgroundColor = (status) => {
    if (status === 'partial') return isDarkMode ? '#7c2d12' : '#ffedd5';   
    if (status === 'completed') return isDarkMode ? '#064e3b' : '#dcfce7'; 
    return isDarkMode ? '#1e293b' : '#ffffff';                             
  };

  const themeContainer = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const themeCard = isDarkMode ? styles.darkCard : styles.lightCard;
  const themeText = isDarkMode ? styles.darkText : styles.lightText;
  const themeSubText = isDarkMode ? styles.darkSubText : styles.lightSubText;
  const themeInput = isDarkMode ? styles.darkInput : styles.lightInput;
  const themePanel = isDarkMode ? styles.darkPanel : styles.lightPanel;

  return (
    <SafeAreaView style={[styles.container, themeContainer]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={styles.headerTitle}>Flugorganisation</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, isDarkMode && styles.darkTabBar]}>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'flights' && styles.activeTabItem]} onPress={() => setActiveTab('flights')}>
          <Text style={[styles.tabText, activeTab === 'flights' && styles.activeTabText, isDarkMode && styles.darkTabTextShared]}>Ad-Hoc-Flüge</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'schedule' && styles.activeTabItem]} onPress={() => setActiveTab('schedule')}>
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText, isDarkMode && styles.darkTabTextShared]}>Flugplan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabItem, activeTab === 'settings' && styles.activeTabItem]} onPress={() => setActiveTab('settings')}>
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText, isDarkMode && styles.darkTabTextShared]}>Einstellungen</Text>
        </TouchableOpacity>
      </View>

      {/* TAB 1: AD-HOC-FLÜGE */}
      {activeTab === 'flights' && (
        <>
          <View style={[styles.filterContainer, themePanel]}>
            <TextInput 
              style={[styles.searchBar, themeInput]}
              placeholder="Flugnummer oder Text suchen..."
              placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
            />
            <Text style={[styles.filterTitle, themeText]}>Zeitraum filtern (TTMMJJJJ):</Text>
            <View style={styles.filterInputRow}>
              <TextInput style={[styles.filterInput, themeInput]} placeholder="Von" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} keyboardType="numeric" maxLength={10} value={filterStart} onChangeText={(text) => setFilterStart(formatFormatDate(text, filterEndRef))} />
              <TextInput ref={filterEndRef} style={[styles.filterInput, themeInput]} placeholder="Bis" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} keyboardType="numeric" maxLength={10} value={filterEnd} onChangeText={(text) => setFilterEnd(formatFormatDate(text, null))} />
            </View>
            <View style={[styles.rowSection, { marginTop: 10 }]}>
              <Text style={[styles.filterTitle, themeText]}>Erledigte ausblenden:</Text>
              <Switch value={hideCompletedFlights} onValueChange={setHideCompletedFlights} trackColor={{ false: '#d1d5db', true: '#10b981' }} />
            </View>
          </View>

          <ScrollView style={styles.listContainer}>
            {filteredFlights.length === 0 ? <Text style={[styles.emptyText, themeSubText]}>Keine Flüge gefunden.</Text> : (
              filteredFlights.map((item) => {
                const airlineColor = getAirlineColor(item.flightNumber);
                const cardBgColor = getStatusBackgroundColor(item.status || 'active');
                return (
                  <TouchableOpacity key={item.id} style={[styles.flightCard, themeCard, { borderLeftColor: airlineColor, backgroundColor: cardBgColor }]} onPress={() => startEditFlight(item)} activeOpacity={0.7}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.flightNumberText, { color: airlineColor }]}>{item.flightNumber}</Text>
                        <Text style={[styles.flightDateText, themeSubText]}>{item.date}</Text>
                      </View>
                      <Text style={[styles.detailText, themeText]}>{item.info}</Text>
                    </View>
                    <TouchableOpacity style={styles.miniDeleteButton} onPress={() => confirmDeleteFlight(item)}><Text style={styles.miniDeleteButtonText}>×</Text></TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
          <TouchableOpacity style={[styles.fab, isDarkMode && styles.darkFab]} onPress={() => { setEditingFlightId(null); setFlightStatus('active'); setModalVisible(true); }}><Text style={styles.fabText}>+</Text></TouchableOpacity>
        </>
      )}

      {/* TAB 2: FLUGPLAN */}
      {activeTab === 'schedule' && (
        <>
          <View style={[styles.filterContainer, themePanel, { paddingBottom: 12 }]}>
            <View style={styles.rowSection}>
              <Text style={[styles.filterTitle, themeText, { marginBottom: 0 }]}>Sortieren nach:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', flex: 1 }}>
                <TouchableOpacity style={[styles.sortBadge, scheduleSortBy === 'startDate' && styles.sortBadgeActive]} onPress={() => setScheduleSortBy('startDate')}>
                  <Text style={[styles.sortBadgeText, scheduleSortBy === 'startDate' && styles.sortBadgeTextActive]}>Startdatum</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortBadge, scheduleSortBy === 'endDate' && styles.sortBadgeActive]} onPress={() => setScheduleSortBy('endDate')}>
                  <Text style={[styles.sortBadgeText, scheduleSortBy === 'endDate' && styles.sortBadgeTextActive]}>Enddatum</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortBadge, scheduleSortBy === 'flightNumber' && styles.sortBadgeActive]} onPress={() => setScheduleSortBy('flightNumber')}>
                  <Text style={[styles.sortBadgeText, scheduleSortBy === 'flightNumber' && styles.sortBadgeTextActive]}>Flug</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.rowSection, { marginTop: 10 }]}>
              <Text style={[styles.filterTitle, themeText]}>Erledigte ausblenden:</Text>
              <Switch value={hideCompletedSchedules} onValueChange={setHideCompletedSchedules} trackColor={{ false: '#d1d5db', true: '#10b981' }} />
            </View>
          </View>

          <ScrollView style={styles.listContainer}>
            {getProcessedSchedules().length === 0 ? (
              <Text style={[styles.emptyText, themeSubText, { marginTop: 40 }]}>Keine passenden Flugpläne gefunden.</Text>
            ) : (
              getProcessedSchedules().map((item) => {
                const airlineColor = getAirlineColor(item.flightNumber);
                const cardBgColor = getStatusBackgroundColor(item.status);
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.flightCard, themeCard, { borderLeftColor: airlineColor, backgroundColor: cardBgColor }]} 
                    onPress={() => startEditSchedule(item)} 
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardContent}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.flightNumberText, { color: airlineColor }]}>{item.flightNumber}</Text>
                        <Text style={[styles.timeTextDisplay, themeText]}>{item.std} → {item.sta}</Text>
                      </View>
                      <View style={styles.cardHeaderRow}>
                        <Text style={[styles.detailText, themeSubText, { fontSize: 12, flex: 1 }]}>{item.startDate} - {item.endDate}</Text>
                        <View style={styles.daysWrapper}>
                          <Text style={[styles.weeksDisplay, themeText, { fontWeight: 'bold' }]}>Tage: {item.days.join('.')}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.miniDeleteButton} onPress={() => confirmDeleteSchedule(item)}><Text style={styles.miniDeleteButtonText}>×</Text></TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
          <TouchableOpacity style={[styles.fab, isDarkMode && styles.darkFab]} onPress={() => { setEditingScheduleId(null); setScheduleModalVisible(true); }}><Text style={styles.fabText}>+</Text></TouchableOpacity>
        </>
      )}

      {/* TAB 3: EINSTELLUNGEN */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.settingsContainer}>
          <View style={[styles.settingsSection, themePanel]}>
            <Text style={[styles.sectionTitle, themeText]}>Entwicklerinformationen</Text>
            <View style={styles.infoRow}><Text style={[styles.infoLabel, themeSubText]}>Entwickler:</Text><Text style={[styles.infoValue, themeText]}>Özgür Cetin</Text></View>
            <View style={styles.infoRow}><Text style={[styles.infoLabel, themeSubText]}>E-Mail:</Text><Text style={[styles.infoValue, themeText, styles.emailText]}>ozgur.cetin@web.de</Text></View>
          </View>

          <View style={[styles.settingsSection, styles.rowSection, themePanel]}>
            <View><Text style={[styles.sectionTitle, themeText, { marginBottom: 2 }]}>Darkmodus</Text><Text style={[styles.infoLabel, themeSubText]}>Dunkles Design aktivieren</Text></View>
            <Switch value={isDarkMode} onValueChange={(val) => {
              setIsDarkMode(val);
              saveData(undefined, undefined, val);
            }} trackColor={{ false: '#d1d5db', true: '#3b82f6' }} />
          </View>

          <View style={[styles.settingsSection, themePanel]}>
            <Text style={[styles.sectionTitle, themeText]}>Backup & Datensicherung</Text>
            <View style={styles.backupButtonRow}>
              <TouchableOpacity style={[styles.backupButton, styles.exportBtn]} onPress={handleExportBackup}><Text style={styles.backupButtonText}>Backup kopieren</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.backupButton, styles.importBtn]} onPress={() => { setBackupInputText(''); setBackupModalVisible(true); }}><Text style={[styles.backupButtonText, { color: '#4b5563' }]}>Backup laden</Text></TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {/* MODAL: AD-HOC FLÜGE */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkPanel : styles.lightPanel]}>
            <Text style={[styles.modalTitle, themeText]}>{editingFlightId ? "Flug bearbeiten" : "Neuen Ad-Hoc Flug eintragen"}</Text>
            <Text style={[styles.inputLabel, themeText]}>Datum (TTMMJJJJ):</Text>
            <TextInput style={[styles.input, themeInput]} placeholder="z.B. 20062026" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} keyboardType="numeric" maxLength={10} value={flightDate} onChangeText={(text) => setFlightDate(formatFormatDate(text, flightNumberRef))} />
            <Text style={[styles.inputLabel, themeText]}>Flugnummer:</Text>
            <TextInput ref={flightNumberRef} style={[styles.input, themeInput]} placeholder="z.B. LH456" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} autoCapitalize="characters" value={flightNumber} onChangeText={setFlightNumber} onSubmitEditing={() => flightInfoRef.current?.focus()} />
            <Text style={[styles.inputLabel, themeText]}>Infos:</Text>
            <TextInput ref={flightInfoRef} style={[styles.input, themeInput]} placeholder="Optional" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} value={flightInfo} onChangeText={setFlightInfo} />
            
            <Text style={[styles.inputLabel, themeText, { marginTop: 8 }]}>Flug Status:</Text>
            <View style={styles.statusRow}>
              <TouchableOpacity style={[styles.statusBtn, flightStatus === 'active' && styles.statusBtnActiveActive]} onPress={() => setFlightStatus('active')}><Text style={[styles.statusBtnText, flightStatus === 'active' && styles.statusBtnTextActive]}>Aktiv</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.statusBtn, styles.statusBtnPartial, flightStatus === 'partial' && styles.statusBtnActivePartial]} onPress={() => setFlightStatus('partial')}><Text style={[styles.statusBtnText, flightStatus === 'partial' && styles.statusBtnTextActive]}>Teilweise</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.statusBtn, styles.statusBtnCompleted, flightStatus === 'completed' && styles.statusBtnActiveCompleted]} onPress={() => setFlightStatus('completed')}><Text style={[styles.statusBtnText, flightStatus === 'completed' && styles.statusBtnTextActive]}>Erledigt</Text></TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.buttonCancel} onPress={() => setModalVisible(false)}><Text>Abbrechen</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.buttonSave, isDarkMode && styles.darkFab]} onPress={saveFlightForm}><Text style={{color:'#fff'}}>Speichern</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: FLUGPLAN */}
      <Modal animationType="slide" transparent={true} visible={scheduleModalVisible}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center', alignItems: 'center', width: '100%'}}>
            <View style={[styles.modalContent, isDarkMode ? styles.darkPanel : styles.lightPanel]}>
              <Text style={[styles.modalTitle, themeText]}>{editingScheduleId ? "Flugplan bearbeiten" : "Neuen Flugplan erstellen"}</Text>
              <Text style={[styles.inputLabel, themeText]}>Flugnummer:</Text>
              <TextInput style={[styles.input, themeInput]} placeholder="z.B. SQ326" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} autoCapitalize="characters" value={schedFlightNumber} onChangeText={setSchedFlightNumber} onSubmitEditing={() => schedStartDateRef.current?.focus()} />
              <Text style={[styles.inputLabel, themeText]}>Startdatum (TTMMJJJJ):</Text>
              <TextInput ref={schedStartDateRef} style={[styles.input, themeInput]} placeholder="z.B. 01042026" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} keyboardType="numeric" maxLength={10} value={schedStartDate} onChangeText={(text) => setSchedStartDate(formatFormatDate(text, schedEndDateRef))} />
              <Text style={[styles.inputLabel, themeText]}>Enddatum (TTMMJJJJ):</Text>
              <TextInput ref={schedEndDateRef} style={[styles.input, themeInput]} placeholder="z.B. 25102026" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} keyboardType="numeric" maxLength={10} value={schedEndDate} onChangeText={(text) => setSchedEndDate(formatFormatDate(text, schedSTARef))} />
              
              <View style={styles.filterInputRow}>
                <View style={{ width: '48%' }}>
                  <Text style={[styles.inputLabel, themeText]}>STA (Ankunft HHMM):</Text>
                  <TextInput ref={schedSTARef} style={[styles.input, themeInput, {textAlign: 'center'}]} placeholder="1845" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} keyboardType="numeric" maxLength={5} value={schedSTA} onChangeText={(text) => setSchedSTA(formatTimeInput(text, schedSTDRef))} />
                </View>
                <View style={{ width: '48%' }}>
                  <Text style={[styles.inputLabel, themeText]}>STD (Abflug HHMM):</Text>
                  <TextInput ref={schedSTDRef} style={[styles.input, themeInput, {textAlign: 'center'}]} placeholder="1230" placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} keyboardType="numeric" maxLength={5} value={schedSTD} onChangeText={(text) => setSchedSTD(formatTimeInput(text, null))} />
                </View>
              </View>

              <Text style={[styles.inputLabel, themeText, { marginTop: 12, marginBottom: 6 }]}>Geplante Wochentage (1-7):</Text>
              <View style={styles.weekdayRow}>
                {WEEKDAYS.map((day) => {
                  const isSelected = schedDays.includes(day.id);
                  return (
                    <TouchableOpacity key={day.id} style={[styles.dayButton, isSelected && styles.dayButtonSelected]} onPress={() => toggleWeekday(day.id)}>
                      <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>{day.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, themeText, { marginTop: 8 }]}>Flugplan Status:</Text>
              <View style={styles.statusRow}>
                <TouchableOpacity style={[styles.statusBtn, schedStatus === 'active' && styles.statusBtnActiveActive]} onPress={() => setSchedStatus('active')}><Text style={[styles.statusBtnText, schedStatus === 'active' && styles.statusBtnTextActive]}>Aktiv</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.statusBtn, styles.statusBtnPartial, schedStatus === 'partial' && styles.statusBtnActivePartial]} onPress={() => setSchedStatus('partial')}><Text style={[styles.statusBtnText, schedStatus === 'partial' && styles.statusBtnTextActive]}>Teilweise</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.statusBtn, styles.statusBtnCompleted, schedStatus === 'completed' && styles.statusBtnActiveCompleted]} onPress={() => setSchedStatus('completed')}><Text style={[styles.statusBtnText, schedStatus === 'completed' && styles.statusBtnTextActive]}>Erledigt</Text></TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.buttonCancel} onPress={() => setScheduleModalVisible(false)}><Text>Abbrechen</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.buttonSave, isDarkMode && styles.darkFab]} onPress={saveScheduleForm}><Text style={{ color: '#ffffff', fontWeight: '600' }}>Speichern</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* BACKUP MODAL */}
      <Modal animationType="fade" transparent={true} visible={backupModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode ? styles.darkPanel : styles.lightPanel]}>
            <Text style={[styles.modalTitle, themeText]}>Backup einfügen</Text>
            <TextInput style={[styles.input, themeInput, { height: 100, textAlignVertical: 'top' }]} placeholder="Hier Backup-Text einfügen..." placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'} multiline={true} value={backupInputText} onChangeText={setBackupInputText} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.buttonCancel} onPress={() => setBackupModalVisible(false)}><Text>Abbrechen</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.buttonSave, isDarkMode && styles.darkFab]} onPress={saveImportedBackup}><Text style={{ color: '#ffffff', fontWeight: '600' }}>Laden</Text></TouchableOpacity>
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
  darkPanel: { backgroundColor: '#1e293b' },
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
  filterContainer: { padding: 12 },
  searchBar: { borderWidth: 1, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, fontSize: 14, marginBottom: 8 },
  filterTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  filterInputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  filterInput: { borderWidth: 1, borderRadius: 6, padding: 6, fontSize: 14, width: '48%', textAlign: 'center' },
  rowSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sortBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e5e7eb', marginLeft: 6, marginBottom: 4 },
  sortBadgeActive: { backgroundColor: '#3b82f6' },
  sortBadgeText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  sortBadgeTextActive: { color: '#ffffff', fontWeight: 'bold' },
  listContainer: { flex: 1, padding: 10 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 14 },
  flightCard: { borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 5, elevation: 1 },
  cardContent: { flex: 1, paddingRight: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  flightNumberText: { fontSize: 16, fontWeight: 'bold', width: 90 },
  flightDateText: { fontSize: 13 },
  timeTextDisplay: { fontSize: 14, fontWeight: '600' },
  daysWrapper: { 
    width: 120, 
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  weeksDisplay: { 
    fontSize: 13,
    textAlign: 'right'
  },
  detailText: { fontSize: 13 },
  miniDeleteButton: { padding: 6 },
  miniDeleteButtonText: { fontSize: 22, color: '#9ca3af', fontWeight: '300' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1e3a8a', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  darkFab: { backgroundColor: '#3b82f6' },
  fabText: { color: '#ffffff', fontSize: 26, fontWeight: '300' },
  settingsContainer: { flex: 1, padding: 12 },
  settingsSection: { borderRadius: 8, padding: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
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
  modalContent: { width: '85%', borderRadius: 12, padding: 16, maxHeight: '90%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, fontSize: 14 },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 10 },
  dayButton: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  dayButtonSelected: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  dayButtonText: { fontSize: 13, fontWeight: '500', color: '#4b5563' },
  dayButtonTextSelected: { color: '#ffffff', fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', marginHorizontal: 2, backgroundColor: '#f9fafb' },
  statusBtnActiveActive: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
  statusBtnActivePartial: { backgroundColor: '#ea580c', borderColor: '#c2410c' },
  statusBtnActiveCompleted: { backgroundColor: '#10b981', borderColor: '#047857' },
  statusBtnText: { fontSize: 12, fontWeight: '500', color: '#4b5563' },
  statusBtnTextActive: { color: '#ffffff', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  buttonCancel: { flex: 1, padding: 10, borderRadius: 6, backgroundColor: '#f3f4f6', alignItems: 'center', marginRight: 6 },
  buttonSave: { flex: 1, padding: 10, borderRadius: 6, backgroundColor: '#1e3a8a', alignItems: 'center', marginLeft: 6 },
});
