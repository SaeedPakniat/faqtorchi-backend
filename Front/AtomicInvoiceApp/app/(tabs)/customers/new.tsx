// // app/(tabs)/customers/new.tsx
// import { useRouter } from "expo-router";
// import React, { useMemo, useState } from "react";
// import { Image, ScrollView, StyleSheet, View } from "react-native";

// import AppButton from "@/components/ui/AppButton";
// import AppInput from "@/components/ui/AppInput";
// import AppText from "@/components/ui/AppText";
// import Card from "@/components/ui/Card";
// import { AppColors } from "@/constants/appColors";
// import { Typography } from "@/constants/typography";

// export default function AddNewCustomerScreen() {
//   const router = useRouter();

//   // fake generated id
//   const customerId = useMemo(
//     () => String(Math.floor(1000000 + Math.random() * 9000000)),
//     [],
//   );

//   const [name, setName] = useState("");
//   const [nationalId, setNationalId] = useState("");
//   const [phone, setPhone] = useState("");
//   const [city, setCity] = useState("");
//   const [zip, setZip] = useState("");

//   return (
//     <View style={styles.screen}>
//       <ScrollView
//         style={{ flex: 1 }}
//         contentContainerStyle={{ paddingBottom: 24 }}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Title Row */}
//         <View style={styles.titleRow}>
//           <AppButton
//             title="←"
//             variant="outline"
//             onPress={() => router.back()}
//             style={styles.backBtn}
//           />

//           <AppText style={styles.pageTitle}>Add New Customer</AppText>
//         </View>

//         {/* Upload */}
//         <View style={styles.uploadWrap}>
//           <View style={styles.uploadCircle}>
//             <Image
//               source={require("../../assets/icons/common/upload-img.png")}
//               style={{ width: 34, height: 34, opacity: 0.6 }}
//               resizeMode="contain"
//             />
//           </View>
//           <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
//             customer Image
//           </AppText>
//         </View>

//         <Card style={{ marginTop: 10 }}>
//           <AppInput label="Customer ID" value={customerId} editable={false} />

//           <AppInput
//             label="Name"
//             value={name}
//             onChangeText={setName}
//             placeholder="Name"
//             style={{ marginTop: 10 }}
//           />

//           <AppInput
//             label="National ID"
//             value={nationalId}
//             onChangeText={setNationalId}
//             placeholder="National ID"
//             keyboardType="number-pad"
//             style={{ marginTop: 10 }}
//           />

//           <AppInput
//             label="Phone"
//             value={phone}
//             onChangeText={setPhone}
//             placeholder="phone"
//             keyboardType="number-pad"
//             style={{ marginTop: 10 }}
//           />

//           <View style={styles.row2}>
//             <View style={{ flex: 1 }}>
//               <AppInput
//                 label="City"
//                 value={city}
//                 onChangeText={setCity}
//                 placeholder="city"
//               />
//             </View>
//             <View style={{ flex: 1 }}>
//               <AppInput
//                 label="Zip-code"
//                 value={zip}
//                 onChangeText={setZip}
//                 placeholder="zip-code"
//                 keyboardType="number-pad"
//               />
//             </View>
//           </View>

//           <AppButton
//             title="Submit"
//             onPress={() => router.back()}
//             style={{ marginTop: 14 }}
//           />
//         </Card>
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   screen: {
//     flex: 1,
//     backgroundColor: AppColors.background,
//     paddingHorizontal: 16,
//     paddingTop: 0,
//   },
//   // header: {
//   //   flexDirection: "row",
//   //   alignItems: "center",
//   //   justifyContent: "space-between",
//   //   marginBottom: 10,
//   // },
//   // brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
//   // logo: { width: 38, height: 38 },
//   // brandTitle: { fontSize: 16, fontWeight: "700" },
//   // brandSub: { fontSize: 12 },
//   // roundIcon: {
//   //   width: 34,
//   //   height: 34,
//   //   borderRadius: 17,
//   //   backgroundColor: "#fff",
//   //   borderWidth: 1,
//   //   borderColor: AppColors.border,
//   //   alignItems: "center",
//   //   justifyContent: "center",
//   // },

//   titleRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 10,
//     marginTop: 0,
//   },
//   backBtn: { width: 44, height: 36, borderRadius: 10 },
//   pageTitle: { ...Typography.subtitle },

//   uploadWrap: { alignItems: "center", marginTop: 12 },
//   uploadCircle: {
//     width: 92,
//     height: 92,
//     borderRadius: 46,
//     backgroundColor: "#EFEFFF",
//     alignItems: "center",
//     justifyContent: "center",
//   },

//   row2: { flexDirection: "row", gap: 10, marginTop: 10 },
// });

// app/(tabs)/customers/new.tsx
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";

import AppButton from "@/components/ui/AppButton";
import AppInput from "@/components/ui/AppInput";
import AppText from "@/components/ui/AppText";
import Card from "@/components/ui/Card";
import { AppColors } from "@/constants/appColors";
import { Typography } from "@/constants/typography";
import { ApiError, USE_REAL_API } from "@/src/lib/api";
import { createCustomer } from "@/src/lib/customerApi";

export default function AddNewCustomerScreen() {
  const router = useRouter();

  const customerId = useMemo(
    () => String(Math.floor(1000000 + Math.random() * 9000000)),
    [],
  );

  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ✅ Title Row مثل دیزاین */}
        <View style={styles.titleRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Image
              // TODO: مسیر آیکن back
              source={require("../../assets/icons/common/back.png")}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </Pressable>

          <AppText style={styles.pageTitle}>Add New Customer</AppText>
        </View>

        {/* Upload */}
        <View style={styles.uploadWrap}>
          <View style={styles.uploadCircle}>
            <Image
              source={require("../../assets/icons/common/upload-img.png")}
              style={{ width: 34, height: 34, opacity: 0.6 }}
              resizeMode="contain"
            />
          </View>
          <AppText color={AppColors.muted} style={{ marginTop: 8 }}>
            customer Image
          </AppText>
        </View>

        <Card style={{ marginTop: 10 }}>
          {/* ✅ Customer ID */}
          <View style={styles.labelRow}>
            <AppText style={styles.inputLabel}>Customer ID</AppText>
            <Image
              // TODO: مسیر آیکن سوال
              source={require("../../assets/icons/common/question-mark.png")}
              style={styles.qIcon}
              resizeMode="contain"
            />
          </View>
          <AppInput value={customerId} editable={false} />

          {/* ✅ Name */}
          <View style={[styles.labelRow, { marginTop: 10 }]}>
            <AppText style={styles.inputLabel}>Name</AppText>
            <Image
              source={require("../../assets/icons/common/question-mark.png")}
              style={styles.qIcon}
              resizeMode="contain"
            />
          </View>
          <AppInput value={name} onChangeText={setName} placeholder="Name" />

          {/* ✅ National ID */}
          <View style={[styles.labelRow, { marginTop: 10 }]}>
            <AppText style={styles.inputLabel}>National ID</AppText>
            <Image
              source={require("../../assets/icons/common/question-mark.png")}
              style={styles.qIcon}
              resizeMode="contain"
            />
          </View>
          <AppInput
            value={nationalId}
            onChangeText={setNationalId}
            placeholder="National ID"
            keyboardType="number-pad"
          />

          {/* ✅ Phone */}
          <View style={[styles.labelRow, { marginTop: 10 }]}>
            <AppText style={styles.inputLabel}>Phone</AppText>
            <Image
              source={require("../../assets/icons/common/question-mark.png")}
              style={styles.qIcon}
              resizeMode="contain"
            />
          </View>
          <AppInput
            value={phone}
            onChangeText={setPhone}
            placeholder="phone"
            keyboardType="number-pad"
          />

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              {/* ✅ City */}
              <View style={styles.labelRow}>
                <AppText style={styles.inputLabel}>City</AppText>
                <Image
                  source={require("../../assets/icons/common/question-mark.png")}
                  style={styles.qIcon}
                  resizeMode="contain"
                />
              </View>
              <AppInput
                value={city}
                onChangeText={setCity}
                placeholder="city"
              />
            </View>

            <View style={{ flex: 1 }}>
              {/* ✅ Zip-code */}
              <View style={styles.labelRow}>
                <AppText style={styles.inputLabel}>Zip-code</AppText>
                <Image
                  source={require("../../assets/icons/common/question-mark.png")}
                  style={styles.qIcon}
                  resizeMode="contain"
                />
              </View>
              <AppInput
                value={zip}
                onChangeText={setZip}
                placeholder="zip-code"
                keyboardType="number-pad"
              />
            </View>
          </View>

          {!!error && (
            <AppText color={AppColors.danger} style={{ marginTop: 8 }}>
              {error}
            </AppText>
          )}

          <AppButton
            title={submitting ? "Saving..." : "Submit"}
            onPress={async () => {
              if (submitting) return;
              if (!phone.trim()) {
                setError("Phone is required");
                return;
              }
              setSubmitting(true);
              try {
                setError("");
                if (USE_REAL_API) {
                  const notesParts = [
                    nationalId ? `nationalId:${nationalId}` : "",
                    city ? `city:${city}` : "",
                    zip ? `zip:${zip}` : "",
                  ].filter(Boolean);
                  await createCustomer({
                    phone: phone.trim(),
                    name: name.trim() || undefined,
                    notes: notesParts.length ? notesParts.join(" | ") : undefined,
                  });
                }
                router.back();
              } catch (e) {
                const err = e as ApiError;
                setError(err.message || "Failed to create customer");
              } finally {
                setSubmitting(false);
              }
            }}
            style={{ marginTop: 14 }}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: 16,
    paddingTop: 0,
  },

  /** ✅ Title like design */
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 0,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { width: 18, height: 18, tintColor: AppColors.accent },
  pageTitle: { ...Typography.subtitle, color: AppColors.text },

  uploadWrap: { alignItems: "center", marginTop: 12 },
  uploadCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: AppColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },

  /** ✅ label + question icon row */
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: AppColors.text,
  },
  qIcon: {
    width: 14,
    height: 14,
    tintColor: AppColors.accent,
    opacity: 0.95,
  },

  row2: { flexDirection: "row", gap: 10, marginTop: 10 },
});
