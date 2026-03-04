import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    name: string;
    email?: string;
    phone?: string;
}
export type Time = bigint;
export interface PairingInfo {
    trailerId: string;
    tractorId: string;
    notes: string;
    category: Category;
    assetType: AssetType;
    driverName?: string;
}
export interface DownAssetWithPairing {
    assetLabel?: AssetLabel;
    ownerId: Principal;
    assetNumber: string;
    downReason: string;
    lastUpdated?: Time;
    vilkDate?: Time;
    downDate: Time;
    standaloneCategory?: Category;
    previousPairing?: PairingInfo;
    aviDate: Time;
    assetType: AssetType;
    driverName?: string;
}
export interface AssetPairing {
    pairedDate: Time;
    ownerId: Principal;
    tractorId: string;
    secondAssetId: string;
    notes: string;
    category: Category;
    assetType: AssetType;
    driverName?: string;
}
export interface DownAsset {
    assetLabel?: AssetLabel;
    ownerId: Principal;
    assetNumber: string;
    downReason: string;
    lastUpdated?: Time;
    vilkDate?: Time;
    downDate: Time;
    standaloneCategory?: Category;
    aviDate: Time;
    assetType: AssetType;
    driverName?: string;
}
export interface AssetHistory {
    changeType: Variant_created_deleted_updated_paired_unpaired;
    ownerId: Principal;
    assetId: string;
    timestamp: Time;
    details: string;
}
export interface Asset {
    assetLabel?: AssetLabel;
    ownerId: Principal;
    assetNumber: string;
    vilkDate?: Time;
    standaloneCategory?: Category;
    aviDate: Time;
    assetType: AssetType;
    driverName?: string;
}
export enum AssetLabel {
    tundra = "tundra",
    threeTank = "threeTank",
    f250 = "f250",
    f350 = "f350",
    twoTank = "twoTank",
    notApplicable = "notApplicable",
    ptoTractor = "ptoTractor",
    dodgeRam = "dodgeRam"
}
export enum AssetType {
    pump = "pump",
    pickup = "pickup",
    tractor = "tractor",
    trailer = "trailer"
}
export enum Category {
    killTrucks = "killTrucks",
    floatTrailer = "floatTrailer",
    spareTractors = "spareTractors",
    fracPumps = "fracPumps",
    misc = "misc",
    combo = "combo",
    transports = "transports",
    acidFracs = "acidFracs",
    treatersTrucksAndTrailers = "treatersTrucksAndTrailers"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_created_deleted_updated_paired_unpaired {
    created = "created",
    deleted = "deleted",
    updated = "updated",
    paired = "paired",
    unpaired = "unpaired"
}
export enum Variant_upcoming_expired {
    upcoming = "upcoming",
    expired = "expired"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAsset(assetNumber: string, assetType: AssetType, aviDate: Time, vilkDate: Time | null, assetLabel: AssetLabel | null, standaloneCategory: Category | null, driverName: string | null): Promise<void>;
    createPairing(tractorId: string, secondAssetId: string, assetType: AssetType, category: Category, notes: string, driverName: string | null): Promise<void>;
    deleteAsset(assetNumber: string): Promise<void>;
    getAllAssets(): Promise<Array<Asset>>;
    getAllDownAssets(): Promise<Array<DownAsset>>;
    getAllDownAssetsWithPairing(): Promise<Array<DownAssetWithPairing>>;
    getAllPairings(): Promise<Array<AssetPairing>>;
    getAssetById(assetNumber: string): Promise<Asset | null>;
    getAssetHistory(): Promise<Array<AssetHistory>>;
    getAssetsByInspectionStatus(status: Variant_upcoming_expired): Promise<Array<Asset>>;
    getAssetsByType(assetType: AssetType): Promise<Array<Asset>>;
    getAvailableAssetsForPairing(assetType: AssetType): Promise<Array<Asset>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDownAssetById(assetNumber: string): Promise<DownAssetWithPairing | null>;
    getInspectionAlerts(): Promise<{
        upcoming: Array<Asset>;
        expired: Array<Asset>;
        upcomingVilk: Array<Asset>;
        expiredVilk: Array<Asset>;
    }>;
    getPairingByTractorId(tractorId: string): Promise<AssetPairing | null>;
    getPairingsByCategory(category: Category): Promise<Array<AssetPairing>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markAssetAsDown(assetNumber: string, reason: string): Promise<void>;
    markAssetAsDownNoPairing(assetNumber: string, reason: string): Promise<void>;
    reactivateDownAsset(assetNumber: string): Promise<{
        reactivated: boolean;
        restoredPairing: boolean;
    }>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    unpairAssets(tractorId: string): Promise<void>;
    updateAsset(assetNumber: string, newAviDate: Time, newVilkDate: Time | null, newAssetLabel: AssetLabel | null, newStandaloneCategory: Category | null, newDriverName: string | null): Promise<void>;
    updateDownReason(assetNumber: string, newReason: string): Promise<void>;
    updateDriverName(tractorId: string, driverName: string | null): Promise<void>;
    updatePairing(tractorId: string, category: Category, notes: string, driverName: string | null): Promise<void>;
    updatePickupDriverName(assetNumber: string, driverName: string | null): Promise<void>;
}
