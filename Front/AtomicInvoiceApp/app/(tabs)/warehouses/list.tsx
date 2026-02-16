import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppInput from "../../../components/ui/AppInput";
import AppText from "../../../components/ui/AppText";
import Card from "../../../components/ui/Card";
import { AppColors } from "../../../constants/appColors";
import { USE_REAL_API } from "../../../src/lib/api";
import { ApiProduct, createProduct, listProducts } from "../../../src/lib/inventoryApi";
import { useInventory } from "../../../src/store/inventory/InventoryContext";

export default function ProductsScreen() {
  const router = useRouter();
  const { loading, state, addProduct, removeProduct } = useInventory();
  const [name, setName] = useState("");
  const [apiLoading, setApiLoading] = useState(USE_REAL_API);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);

  useEffect(() => {
    if (!USE_REAL_API) return;
    let mounted = true;
    (async () => {
      try {
        const res = await listProducts();
        if (mounted) setApiProducts(res.products);
      } catch {
        if (mounted) setApiProducts([]);
      } finally {
        if (mounted) setApiLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    if (USE_REAL_API) {
      return apiProducts.map((p) => ({
        ...p,
        variantsCount: p.variants?.length ?? 0,
      }));
    }
    const variantsByProduct = new Map<string, number>();
    state.variants.forEach((v) =>
      variantsByProduct.set(
        v.productId,
        (variantsByProduct.get(v.productId) ?? 0) + 1,
      ),
    );

    return state.products.map((p) => ({
      ...p,
      variantsCount: variantsByProduct.get(p.id) ?? 0,
    }));
  }, [state.products, state.variants]);

  return (
    <View style={styles.container}>
      <AppText variant="title">Products</AppText>

      <Card style={{ marginTop: 14 }}>
        <AppText variant="subtitle">Add product</AppText>
        <AppInput
          label="Product name"
          value={name}
          onChangeText={setName}
          placeholder="Example: iPhone 13"
        />
        <AppButton
          title="Add"
          onPress={async () => {
            if (!name.trim()) return;
            if (USE_REAL_API) {
              try {
                await createProduct({ name: name.trim() });
                const res = await listProducts();
                setApiProducts(res.products);
                setName("");
              } catch {
                // noop
              }
            } else {
              addProduct(name);
              setName("");
            }
          }}
          style={{ marginTop: 10 }}
        />
      </Card>

      <Card style={{ marginTop: 12, flex: 1 }}>
        <AppText variant="subtitle">Products list</AppText>

        {(USE_REAL_API ? apiLoading : loading) ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            Loading...
          </AppText>
        ) : rows.length === 0 ? (
          <AppText color={AppColors.muted} style={{ marginTop: 10 }}>
            No products added yet.
          </AppText>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <Card style={{ marginTop: 10 }}>
                <View style={styles.row}>
                  <AppText variant="subtitle">{item.name}</AppText>
                  <AppText color={AppColors.muted}>
                    {item.variantsCount} variants
                  </AppText>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <AppButton
                    title="Manage"
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/warehouses/product/[id]",
                        params: { id: item.id },
                      })
                    }
                    style={{ flex: 1 }}
                  />
                  <AppButton
                    title="Delete"
                    variant="outline"
                    onPress={() =>
                      USE_REAL_API
                        ? Alert.alert("Coming soon", "Product deletion is not enabled in the API yet.")
                        : removeProduct(item.id)
                    }
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 16,
    paddingTop: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
