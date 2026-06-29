import { useCallback, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import type { SavedFieldResponse } from "../types/domain";

type ApiRequest = <T>(path: string, options?: RequestInit) => Promise<T>;

type UseAdminFieldsOptions = {
  request: ApiRequest;
  userCity: string;
  draftLatitude: number;
  draftLongitude: number;
  selectedSavedFieldId: string | null;
  onSelectSavedField: (field: SavedFieldResponse) => void;
  onClearSelectedSavedField: () => void;
  setLoading: Dispatch<SetStateAction<boolean>>;
};

export function useAdminFields({
  request,
  userCity,
  draftLatitude,
  draftLongitude,
  selectedSavedFieldId,
  onSelectSavedField,
  onClearSelectedSavedField,
  setLoading,
}: UseAdminFieldsOptions) {
  const [savedFields, setSavedFields] = useState<SavedFieldResponse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Huelva");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const load = useCallback(async () => {
    const fields = await request<SavedFieldResponse[]>("/api/fields");
    setSavedFields(fields);
  }, [request]);

  const startCreate = useCallback(() => {
    setEditingId(null);
    setName("");
    setAddress("");
    setCity(userCity);
    setLatitude(draftLatitude.toFixed(6));
    setLongitude(draftLongitude.toFixed(6));
  }, [draftLatitude, draftLongitude, userCity]);

  const startEdit = useCallback((field: SavedFieldResponse) => {
    setEditingId(field.id);
    setName(field.name);
    setAddress(field.address ?? "");
    setCity(field.city ?? "");
    setLatitude(String(field.latitude ?? ""));
    setLongitude(String(field.longitude ?? ""));
  }, []);

  const save = useCallback(async () => {
    const latitudeValue = Number(latitude.replace(",", "."));
    const longitudeValue = Number(longitude.replace(",", "."));
    if (
      !name.trim() ||
      !Number.isFinite(latitudeValue) ||
      !Number.isFinite(longitudeValue)
    ) {
      Alert.alert(
        "Revisa la pista",
        "Nombre, latitud y longitud son obligatorios.",
      );
      return;
    }

    setLoading(true);
    try {
      const body = JSON.stringify({
        name: name.trim(),
        address: address.trim() || null,
        city: city.trim() || null,
        latitude: latitudeValue,
        longitude: longitudeValue,
      });
      const saved = await request<SavedFieldResponse>(
        editingId ? `/api/fields/${editingId}` : "/api/fields",
        {
          method: editingId ? "PUT" : "POST",
          body,
        },
      );
      await load();
      onSelectSavedField(saved);
      startCreate();
    } catch (error) {
      Alert.alert(
        "No se pudo guardar",
        error instanceof Error ? error.message : "Error inesperado",
      );
    } finally {
      setLoading(false);
    }
  }, [
    address,
    city,
    editingId,
    latitude,
    load,
    longitude,
    name,
    onSelectSavedField,
    request,
    setLoading,
    startCreate,
  ]);

  const remove = useCallback(
    async (field: SavedFieldResponse) => {
      setLoading(true);
      try {
        await request(`/api/fields/${field.id}`, { method: "DELETE" });
        if (selectedSavedFieldId === field.id) {
          onClearSelectedSavedField();
        }
        await load();
      } catch (error) {
        Alert.alert(
          "No se pudo eliminar",
          error instanceof Error ? error.message : "Error inesperado",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      load,
      onClearSelectedSavedField,
      request,
      selectedSavedFieldId,
      setLoading,
    ],
  );

  return {
    savedFields,
    setSavedFields,
    editingId,
    name,
    address,
    city,
    latitude,
    longitude,
    load,
    startCreate,
    startEdit,
    save,
    remove,
    setName,
    setAddress,
    setCity,
    setLatitude,
    setLongitude,
  };
}
