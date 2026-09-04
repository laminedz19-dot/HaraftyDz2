import MapView, { Marker } from "react-native-maps";
import { StyleSheet } from "react-native";

type Props = { latitude: number; longitude: number; onSelect: (latitude: number, longitude: number) => void };

export function ServiceMap({ latitude, longitude, onSelect }: Props) {
  const coordinate = { latitude, longitude };
  return <MapView style={styles.map} initialRegion={{ ...coordinate, latitudeDelta: 0.06, longitudeDelta: 0.06 }} region={{ ...coordinate, latitudeDelta: 0.06, longitudeDelta: 0.06 }} onPress={(event) => onSelect(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)}><Marker coordinate={coordinate} title="موقع الخدمة" /></MapView>;
}
const styles = StyleSheet.create({ map: { height: 155, borderRadius: 15 } });
