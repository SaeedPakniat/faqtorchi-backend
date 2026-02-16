import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

type DownloadPdfInput = {
  url: string;
  fileName: string;
  headers?: Record<string, string>;
};

export async function downloadAndSharePdf({ url, fileName, headers }: DownloadPdfInput): Promise<void> {
  if (Platform.OS === "web") {
    Alert.alert("Not supported on web", "Use the public PDF link on web.");
    return;
  }

  const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!baseDir) {
    Alert.alert("Storage error", "No writable directory available.");
    return;
  }

  const fileUri = `${baseDir}${fileName}`;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers,
  });

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    Alert.alert("Sharing not available", "Sharing is not available on this device.");
    return;
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: "application/pdf",
    dialogTitle: "Invoice PDF",
    UTI: "com.adobe.pdf",
  });
}
