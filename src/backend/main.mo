import List "mo:core/List";
import Set "mo:core/Set";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  type AssetType = {
    #tractor;
    #trailer;
    #pump;
    #pickup;
  };

  type Category = {
    #transports;
    #killTrucks;
    #combo;
    #acidFracs;
    #fracPumps;
    #treatersTrucksAndTrailers;
    #misc;
    #spareTractors;
    #floatTrailer;
  };

  type AssetLabel = {
    #ptoTractor;
    #twoTank;
    #threeTank;
    #f250;
    #f350;
    #dodgeRam;
    #tundra;
    #notApplicable;
  };

  public type Asset = {
    assetNumber : Text;
    assetType : AssetType;
    aviDate : Time.Time;
    vilkDate : ?Time.Time;
    assetLabel : ?AssetLabel;
    standaloneCategory : ?Category;
    driverName : ?Text;
    ownerId : Principal;
  };

  type DownAsset = {
    assetNumber : Text;
    assetType : AssetType;
    aviDate : Time.Time;
    vilkDate : ?Time.Time;
    assetLabel : ?AssetLabel;
    downReason : Text;
    downDate : Time.Time;
    lastUpdated : ?Time.Time;
    standaloneCategory : ?Category;
    driverName : ?Text;
    ownerId : Principal;
  };

  type PairingInfo = {
    tractorId : Text;
    trailerId : Text;
    assetType : AssetType;
    category : Category;
    notes : Text;
    driverName : ?Text;
  };

  type DownAssetWithPairing = {
    assetNumber : Text;
    assetType : AssetType;
    aviDate : Time.Time;
    vilkDate : ?Time.Time;
    assetLabel : ?AssetLabel;
    downReason : Text;
    downDate : Time.Time;
    lastUpdated : ?Time.Time;
    previousPairing : ?PairingInfo;
    standaloneCategory : ?Category;
    driverName : ?Text;
    ownerId : Principal;
  };

  public type AssetPairing = {
    tractorId : Text;
    secondAssetId : Text;
    assetType : AssetType;
    category : Category;
    notes : Text;
    pairedDate : Time.Time;
    driverName : ?Text;
    ownerId : Principal;
  };

  module AssetPairing {
    public func compare(a : AssetPairing, b : AssetPairing) : Order.Order {
      switch (Text.compare(a.tractorId, b.tractorId)) {
        case (#equal) { Text.compare(a.secondAssetId, b.secondAssetId) };
        case (order) { order };
      };
    };
  };

  type AssetHistory = {
    assetId : Text;
    changeType : { #created; #updated; #deleted; #paired; #unpaired };
    timestamp : Time.Time;
    details : Text;
    ownerId : Principal;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
    phone : ?Text;
  };

  let assets = Map.empty<Text, Asset>();
  let pairings = Map.empty<Text, AssetPairing>();
  let downAssets = Map.empty<Text, DownAsset>();
  let downAssetsWithPairing = Map.empty<Text, DownAssetWithPairing>();
  let history = List.empty<AssetHistory>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Helper function to check if caller is authenticated (not anonymous)
  func isAuthenticated(caller : Principal) : Bool {
    not caller.isAnonymous()
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    // Any authenticated user can view any profile
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Asset Management Functions
  public shared ({ caller }) func createAsset(
    assetNumber : Text,
    assetType : AssetType,
    aviDate : Time.Time,
    vilkDate : ?Time.Time,
    assetLabel : ?AssetLabel,
    standaloneCategory : ?Category,
    driverName : ?Text,
  ) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can create assets");
    };

    if (assets.containsKey(assetNumber) or downAssetsWithPairing.containsKey(assetNumber)) {
      Runtime.trap("Asset with this number already exists");
    };

    if ((assetType == #tractor or assetType == #pump or assetType == #pickup) and vilkDate != null) {
      Runtime.trap("VILK date should only be provided for trailers");
    };

    if (not validateAssetLabel(assetType, assetLabel)) {
      Runtime.trap("Invalid label for asset type");
    };

    if (not validateStandaloneCategory(assetType, standaloneCategory)) {
      Runtime.trap("Invalid standalone category");
    };

    if (assetType == #pickup) {
      if (driverName != null and driverName == ?"" and (assetLabel != null or standaloneCategory != null)) {
        Runtime.trap("Cannot have both label/category and empty driver name for pickup");
      };
    } else {
      if (driverName != null) {
        Runtime.trap("Driver name is only allowed for pickups");
      };
    };

    let asset : Asset = {
      assetNumber;
      assetType;
      aviDate;
      vilkDate = if (assetType == #trailer) { vilkDate } else { null };
      assetLabel;
      standaloneCategory;
      driverName;
      ownerId = caller;
    };
    assets.add(assetNumber, asset);
    recordHistory(assetNumber, #created, "Asset created", caller);
  };

  public shared ({ caller }) func updateAsset(
    assetNumber : Text,
    newAviDate : Time.Time,
    newVilkDate : ?Time.Time,
    newAssetLabel : ?AssetLabel,
    newStandaloneCategory : ?Category,
    newDriverName : ?Text,
  ) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can edit assets");
    };

    let existingAsset = switch (assets.get(assetNumber)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    if ((existingAsset.assetType == #tractor or existingAsset.assetType == #pump or existingAsset.assetType == #pickup) and newVilkDate != null) {
      Runtime.trap("VILK date should not be provided for this asset type");
    };

    if (not validateAssetLabel(existingAsset.assetType, newAssetLabel)) {
      Runtime.trap("Invalid label for asset type");
    };

    if (not validateStandaloneCategory(existingAsset.assetType, newStandaloneCategory)) {
      Runtime.trap("Invalid standalone category");
    };

    if (existingAsset.assetType == #pickup) {
      if (newDriverName != null and newDriverName == ?"" and (newAssetLabel != null or newStandaloneCategory != null)) {
        Runtime.trap("Cannot have both label/category and empty driver name for pickup");
      };
    } else {
      if (newDriverName != null) {
        Runtime.trap("Driver name is only allowed for pickups");
      };
    };

    let updatedAsset : Asset = {
      assetNumber;
      assetType = existingAsset.assetType;
      aviDate = newAviDate;
      vilkDate = if (existingAsset.assetType == #trailer) { newVilkDate } else {
        null;
      };
      assetLabel = newAssetLabel;
      standaloneCategory = newStandaloneCategory;
      driverName = newDriverName;
      ownerId = existingAsset.ownerId;
    };
    assets.add(assetNumber, updatedAsset);
    recordHistory(assetNumber, #updated, "Asset updated (with driver name support)", existingAsset.ownerId);
  };

  public shared ({ caller }) func deleteAsset(assetNumber : Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can delete assets");
    };

    let existingAsset = switch (assets.get(assetNumber)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    assets.remove(assetNumber);
    recordHistory(assetNumber, #deleted, "Asset deleted", existingAsset.ownerId);
  };

  public shared ({ caller }) func markAssetAsDown(assetNumber : Text, reason : Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can mark assets as down");
    };

    let asset = switch (assets.get(assetNumber)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    let previousPairing : ?PairingInfo = switch (getPairingByAssetId(assetNumber)) {
      case (null) { null };
      case (?pairing) {
        ?{
          tractorId = pairing.tractorId;
          trailerId = pairing.secondAssetId;
          assetType = pairing.assetType;
          category = pairing.category;
          notes = pairing.notes;
          driverName = pairing.driverName;
        };
      };
    };

    var pairingsToRemove = List.empty<Text>();
    for ((trKey, p) in pairings.entries()) {
      if (p.tractorId == assetNumber or p.secondAssetId == assetNumber) {
        pairingsToRemove.add(trKey);
        recordHistory(assetNumber, #unpaired, "Asset unpaired due to being marked as down", asset.ownerId);
      };
    };

    for (key in pairingsToRemove.values()) {
      pairings.remove(key);
    };

    let downAssetWithPairing : DownAssetWithPairing = {
      assetNumber = asset.assetNumber;
      assetType = asset.assetType;
      aviDate = asset.aviDate;
      vilkDate = asset.vilkDate;
      assetLabel = asset.assetLabel;
      downReason = reason;
      downDate = Time.now();
      lastUpdated = ?Time.now();
      previousPairing;
      standaloneCategory = asset.standaloneCategory;
      driverName = asset.driverName;
      ownerId = asset.ownerId;
    };

    assets.remove(assetNumber);
    downAssetsWithPairing.add(assetNumber, downAssetWithPairing);
    recordHistory(assetNumber, #updated, "Asset marked as down", asset.ownerId);
  };

  public shared ({ caller }) func markAssetAsDownNoPairing(assetNumber : Text, reason : Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can mark assets as down");
    };

    let asset = switch (assets.get(assetNumber)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    let downAsset : DownAsset = {
      assetNumber = asset.assetNumber;
      assetType = asset.assetType;
      aviDate = asset.aviDate;
      vilkDate = asset.vilkDate;
      assetLabel = asset.assetLabel;
      downReason = reason;
      downDate = Time.now();
      lastUpdated = ?Time.now();
      standaloneCategory = asset.standaloneCategory;
      driverName = asset.driverName;
      ownerId = asset.ownerId;
    };

    assets.remove(assetNumber);
    downAssets.add(assetNumber, downAsset);
    recordHistory(assetNumber, #updated, "Asset marked as down", asset.ownerId);
  };

  // Update Down Reason Function
  public shared ({ caller }) func updateDownReason(assetNumber : Text, newReason : Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can update down reasons");
    };

    var found = false;
    var ownerId : ?Principal = null;

    if (not found) {
      switch (downAssets.get(assetNumber)) {
        case (null) {};
        case (?downAsset) {
          let updatedAsset = {
            assetNumber = downAsset.assetNumber;
            assetType = downAsset.assetType;
            aviDate = downAsset.aviDate;
            vilkDate = downAsset.vilkDate;
            assetLabel = downAsset.assetLabel;
            downReason = newReason;
            downDate = downAsset.downDate;
            lastUpdated = ?Time.now();
            standaloneCategory = downAsset.standaloneCategory;
            driverName = downAsset.driverName;
            ownerId = downAsset.ownerId;
          };
          downAssets.add(assetNumber, updatedAsset);
          ownerId := ?downAsset.ownerId;
          found := true;
        };
      };
    };

    if (not found) {
      switch (downAssetsWithPairing.get(assetNumber)) {
        case (null) {};
        case (?downAssetWithPairing) {
          let updatedAsset = {
            assetNumber = downAssetWithPairing.assetNumber;
            assetType = downAssetWithPairing.assetType;
            aviDate = downAssetWithPairing.aviDate;
            vilkDate = downAssetWithPairing.vilkDate;
            assetLabel = downAssetWithPairing.assetLabel;
            downReason = newReason;
            downDate = downAssetWithPairing.downDate;
            lastUpdated = ?Time.now();
            previousPairing = downAssetWithPairing.previousPairing;
            standaloneCategory = downAssetWithPairing.standaloneCategory;
            driverName = downAssetWithPairing.driverName;
            ownerId = downAssetWithPairing.ownerId;
          };
          downAssetsWithPairing.add(assetNumber, updatedAsset);
          ownerId := ?downAssetWithPairing.ownerId;
          found := true;
        };
      };
    };

    if (not found) {
      Runtime.trap("Down asset not found");
    };

    switch (ownerId) {
      case (?owner) { recordHistory(assetNumber, #updated, "Down reason updated", owner) };
      case (null) {};
    };
  };

  // Asset Reactivation Function
  public shared ({ caller }) func reactivateDownAsset(assetNumber : Text) : async {
    reactivated : Bool;
    restoredPairing : Bool;
  } {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can reactivate assets");
    };

    switch (downAssetsWithPairing.get(assetNumber)) {
      case (null) {
        reactivateDownAssetNoPairing(assetNumber);
        { reactivated = true; restoredPairing = false };
      };
      case (?downAssetWithPairing) {
        let asset : Asset = {
          assetNumber = downAssetWithPairing.assetNumber;
          assetType = downAssetWithPairing.assetType;
          aviDate = downAssetWithPairing.aviDate;
          vilkDate = downAssetWithPairing.vilkDate;
          assetLabel = downAssetWithPairing.assetLabel;
          standaloneCategory = downAssetWithPairing.standaloneCategory;
          driverName = downAssetWithPairing.driverName;
          ownerId = downAssetWithPairing.ownerId;
        };

        downAssetsWithPairing.remove(assetNumber);
        assets.add(assetNumber, asset);
        recordHistory(assetNumber, #updated, "Asset reactivated from down list", downAssetWithPairing.ownerId);

        switch (downAssetWithPairing.previousPairing) {
          case (null) {
            { reactivated = true; restoredPairing = false };
          };
          case (?prevPairing) {
            let otherAssetId = if (prevPairing.tractorId == assetNumber) {
              prevPairing.trailerId;
            } else {
              prevPairing.tractorId;
            };

            let otherAsset = assets.get(otherAssetId);

            switch (otherAsset) {
              case (null) {
                { reactivated = true; restoredPairing = false };
              };
              case (?otherAssetData) {
                let isOtherAssetPaired = pairings.values().toArray().any(
                  func(pairing) {
                    pairing.tractorId == otherAssetId or pairing.secondAssetId == otherAssetId
                  }
                );

                if (not isOtherAssetPaired) {
                  createRestoredPairing(prevPairing, downAssetWithPairing.ownerId);
                  { reactivated = true; restoredPairing = true };
                } else {
                  { reactivated = true; restoredPairing = false };
                };
              };
            };
          };
        };
      };
    };
  };

  func reactivateDownAssetNoPairing(assetNumber : Text) {
    let downAsset = switch (downAssets.get(assetNumber)) {
      case (null) { Runtime.trap("Asset not found in Down Assets") };
      case (?asset) { asset };
    };

    let asset : Asset = {
      assetNumber = downAsset.assetNumber;
      assetType = downAsset.assetType;
      aviDate = downAsset.aviDate;
      vilkDate = downAsset.vilkDate;
      assetLabel = downAsset.assetLabel;
      standaloneCategory = downAsset.standaloneCategory;
      driverName = downAsset.driverName;
      ownerId = downAsset.ownerId;
    };

    downAssets.remove(assetNumber);
    assets.add(assetNumber, asset);
    recordHistory(assetNumber, #updated, "Asset reactivated from down list", downAsset.ownerId);
  };

  func createRestoredPairing(prevPairing : PairingInfo, ownerId : Principal) {
    let newPairing : AssetPairing = {
      tractorId = prevPairing.tractorId;
      secondAssetId = prevPairing.trailerId;
      assetType = prevPairing.assetType;
      category = prevPairing.category;
      notes = prevPairing.notes;
      pairedDate = Time.now();
      driverName = prevPairing.driverName;
      ownerId;
    };

    pairings.add(prevPairing.tractorId, newPairing);
    recordHistory(prevPairing.tractorId, #paired, "Restored pairing after reactivation", ownerId);
    recordHistory(prevPairing.trailerId, #paired, "Restored pairing after reactivation", ownerId);
  };

  // Pairing Functions
  public shared ({ caller }) func createPairing(
    tractorId : Text,
    secondAssetId : Text,
    assetType : AssetType,
    category : Category,
    notes : Text,
    driverName : ?Text,
  ) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can create pairings");
    };

    let _tractorAsset = switch (assets.get(tractorId)) {
      case (null) { Runtime.trap("Tractor asset not found") };
      case (?asset) { asset };
    };

    let _secondAsset = switch (assets.get(secondAssetId)) {
      case (null) { Runtime.trap("Second asset not found") };
      case (?asset) { asset };
    };

    let pairing : AssetPairing = {
      tractorId;
      secondAssetId;
      assetType;
      category;
      notes;
      pairedDate = Time.now();
      driverName = if (category == #treatersTrucksAndTrailers) { driverName } else {
        null;
      };
      ownerId = caller;
    };
    pairings.add(tractorId, pairing);
    recordHistory(tractorId, #paired, "Paired with asset " # secondAssetId, caller);
  };

  public shared ({ caller }) func updatePairing(
    tractorId : Text,
    category : Category,
    notes : Text,
    driverName : ?Text,
  ) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can update pairings");
    };

    let existingPairing = switch (pairings.get(tractorId)) {
      case (null) { Runtime.trap("Pairing not found") };
      case (?pair) { pair };
    };

    let updatedPairing : AssetPairing = {
      tractorId = existingPairing.tractorId;
      secondAssetId = existingPairing.secondAssetId;
      assetType = existingPairing.assetType;
      category;
      notes;
      pairedDate = existingPairing.pairedDate;
      driverName = if (category == #treatersTrucksAndTrailers) { driverName } else {
        null;
      };
      ownerId = existingPairing.ownerId;
    };
    pairings.add(tractorId, updatedPairing);
    recordHistory(tractorId, #updated, "Pairing updated", existingPairing.ownerId);
  };

  public shared ({ caller }) func updateDriverName(tractorId : Text, driverName : ?Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can update driver names");
    };

    let existingPairing = switch (pairings.get(tractorId)) {
      case (null) { Runtime.trap("Pairing not found") };
      case (?pair) { pair };
    };

    if (existingPairing.category != #treatersTrucksAndTrailers) {
      Runtime.trap("Driver name can only be set for Treater Trucks & Trailers");
    };

    let updatedPairing : AssetPairing = {
      tractorId = existingPairing.tractorId;
      secondAssetId = existingPairing.secondAssetId;
      assetType = existingPairing.assetType;
      category = existingPairing.category;
      notes = existingPairing.notes;
      pairedDate = existingPairing.pairedDate;
      driverName;
      ownerId = existingPairing.ownerId;
    };
    pairings.add(tractorId, updatedPairing);
    recordHistory(tractorId, #updated, "Driver name updated", existingPairing.ownerId);
  };

  public shared ({ caller }) func unpairAssets(tractorId : Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can unpair assets");
    };

    let existingPairing = switch (pairings.get(tractorId)) {
      case (null) { Runtime.trap("Pairing not found") };
      case (?pair) { pair };
    };

    pairings.remove(tractorId);
    recordHistory(tractorId, #unpaired, "Unpaired assets", existingPairing.ownerId);
  };

  // Query Functions
  public query ({ caller }) func getAllAssets() : async [Asset] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view assets");
    };
    assets.values().toArray();
  };

  public query ({ caller }) func getAllPairings() : async [AssetPairing] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view pairings");
    };
    pairings.values().toArray();
  };

  public query ({ caller }) func getAllDownAssets() : async [DownAsset] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view down assets");
    };
    downAssets.values().toArray();
  };

  public query ({ caller }) func getAllDownAssetsWithPairing() : async [DownAssetWithPairing] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view down assets");
    };
    downAssetsWithPairing.values().toArray();
  };

  public query ({ caller }) func getAssetById(assetNumber : Text) : async ?Asset {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view assets");
    };
    assets.get(assetNumber);
  };

  public query ({ caller }) func getPairingByTractorId(tractorId : Text) : async ?AssetPairing {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view pairings");
    };
    pairings.get(tractorId);
  };

  public query ({ caller }) func getDownAssetById(assetNumber : Text) : async ?DownAssetWithPairing {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view down assets");
    };
    downAssetsWithPairing.get(assetNumber);
  };

  public query ({ caller }) func getAssetHistory() : async [AssetHistory] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view asset history");
    };
    history.toArray();
  };

  public query ({ caller }) func getInspectionAlerts() : async {
    upcoming : [Asset];
    expired : [Asset];
    upcomingVilk : [Asset];
    expiredVilk : [Asset];
  } {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view inspection alerts");
    };
    let currentTime = Time.now();
    let upcoming = List.empty<Asset>();
    let expired = List.empty<Asset>();
    let upcomingVilk = List.empty<Asset>();
    let expiredVilk = List.empty<Asset>();

    for (asset in assets.values()) {
      let daysLeft = (asset.aviDate - currentTime) / (24 * 60 * 60 * 1000000000);
      if (daysLeft <= 30 and daysLeft > 0) {
        upcoming.add(asset);
      } else if (daysLeft < 0) {
        expired.add(asset);
      };

      switch (asset.vilkDate) {
        case (null) {};
        case (?vilkDate) {
          let vilkDaysLeft = (vilkDate - currentTime) / (24 * 60 * 60 * 1000000000);
          if (vilkDaysLeft <= 30 and vilkDaysLeft > 0) {
            upcomingVilk.add(asset);
          } else if (vilkDaysLeft < 0) {
            expiredVilk.add(asset);
          };
        };
      };
    };

    {
      upcoming = upcoming.values().toArray();
      expired = expired.values().toArray();
      upcomingVilk = upcomingVilk.values().toArray();
      expiredVilk = expiredVilk.values().toArray();
    };
  };

  public query ({ caller }) func getAvailableAssetsForPairing(
    assetType : AssetType
  ) : async [Asset] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view available assets");
    };
    let pairedAssets = Set.empty<Text>();
    for (pairing in pairings.values()) {
      if (pairing.assetType == assetType) {
        pairedAssets.add(pairing.secondAssetId);
      };
    };

    let availableAssets = List.empty<Asset>();
    for (asset in assets.values()) {
      if (asset.assetType == assetType and not pairedAssets.contains(asset.assetNumber)) {
        availableAssets.add(asset);
      };
    };

    availableAssets.values().toArray();
  };

  public query ({ caller }) func getAssetsByType(assetType : AssetType) : async [Asset] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view assets");
    };
    assets.values().toArray().filter(
      func(asset) { asset.assetType == assetType }
    );
  };

  public query ({ caller }) func getPairingsByCategory(category : Category) : async [AssetPairing] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view pairings");
    };
    pairings.values().toArray().filter(
      func(pair) { pair.category == category }
    );
  };

  public query ({ caller }) func getAssetsByInspectionStatus(status : { #upcoming; #expired }) : async [Asset] {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can view inspection status");
    };
    let currentTime = Time.now();
    switch (status) {
      case (#upcoming) {
        assets.values().toArray().filter(
          func(asset) {
            let daysLeft = (asset.aviDate - currentTime) / (24 * 60 * 60 * 1000000000);
            daysLeft <= 30 and daysLeft > 0
          }
        );
      };
      case (#expired) {
        assets.values().toArray().filter(
          func(asset) {
            asset.aviDate < currentTime
          }
        );
      };
    };
  };

  // Update Driver Name for Pickups
  public shared ({ caller }) func updatePickupDriverName(assetNumber : Text, driverName : ?Text) : async () {
    if (not isAuthenticated(caller)) {
      Runtime.trap("Unauthorized: Only authenticated users can update driver names");
    };

    let asset = switch (assets.get(assetNumber)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    if (asset.assetType != #pickup) {
      Runtime.trap("Driver name is only allowed for pickups");
    };

    let updatedAsset : Asset = {
      assetNumber = asset.assetNumber;
      assetType = asset.assetType;
      aviDate = asset.aviDate;
      vilkDate = asset.vilkDate;
      assetLabel = asset.assetLabel;
      standaloneCategory = asset.standaloneCategory;
      driverName;
      ownerId = asset.ownerId;
    };

    assets.add(assetNumber, updatedAsset);
    recordHistory(assetNumber, #updated, "Driver name updated for pickup", asset.ownerId);
  };

  // Helper Functions
  func recordHistory(
    assetId : Text,
    changeType : { #created; #updated; #deleted; #paired; #unpaired },
    details : Text,
    ownerId : Principal
  ) {
    let entry : AssetHistory = {
      assetId;
      changeType;
      timestamp = Time.now();
      details;
      ownerId;
    };
    history.add(entry);
  };

  func getPairingByAssetId(assetNumber : Text) : ?AssetPairing {
    pairings.values().toArray().find(
      func(pairing) { pairing.tractorId == assetNumber or pairing.secondAssetId == assetNumber }
    );
  };

  func validateAssetLabel(assetType : AssetType, assetLabel : ?AssetLabel) : Bool {
    switch (assetType) {
      case (#tractor) {
        switch (assetLabel) {
          case (null) { true };
          case (?l) { l == #ptoTractor };
        };
      };
      case (#trailer) {
        switch (assetLabel) {
          case (null) { true };
          case (?l) { l == #twoTank or l == #threeTank };
        };
      };
      case (#pump) { true };
      case (#pickup) {
        switch (assetLabel) {
          case (null) { true };
          case (?l) {
            l == #f250 or l == #f350 or l == #dodgeRam or l == #tundra;
          };
        };
      };
    };
  };

  func validateStandaloneCategory(assetType : AssetType, standaloneCategory : ?Category) : Bool {
    switch (assetType, standaloneCategory) {
      case (#pickup, null) { true };
      case (#pickup, ?category) { category == #misc };
      case (#tractor, null) { true };
      case (#tractor, ?category) { category == #spareTractors };
      case (_, null) { true };
      case (_, ?_) { false };
    };
  };
};
