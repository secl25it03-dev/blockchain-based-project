// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DonatoDonationRegistry
 * @dev Transparent, immutable donation and fund utilization registry for DONATO.
 * Provides verifiable proof of donation receipts and cryptographic anchoring for NGO utilization reports.
 * 
 * IMPORTANT PRIVACY NOTICE:
 * This contract NEVER stores sensitive Personally Identifiable Information (PII) such as donor names,
 * emails, phone numbers, or private identity documents. Off-chain report documents are anchored
 * exclusively via cryptographic SHA-256 digests (bytes32).
 */
contract DonatoDonationRegistry is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant NGO_ROLE = keccak256("NGO_ROLE");

    enum CampaignStatus {
        Inactive,
        Active,
        Paused,
        Completed,
        Cancelled
    }

    struct Campaign {
        bytes32 campaignId;
        address payable ngoWallet;
        uint256 targetAmount;
        uint256 totalRaised;
        uint256 donationCount;
        CampaignStatus status;
        string metadataUri;
        uint256 createdAt;
        bool exists;
    }

    struct DonationRecord {
        string donationRef;
        bytes32 campaignId;
        address donorAddress;
        uint256 amount;
        string currency;
        bool isNativeCrypto;
        uint256 timestamp;
        bool exists;
    }

    struct UtilizationReport {
        bytes32 campaignId;
        bytes32 reportHash;
        address submitter;
        uint256 amountSpent;
        string category;
        string metadataUri;
        uint256 anchoredAt;
        bool exists;
    }

    // Storage mappings
    mapping(bytes32 => Campaign) private _campaigns;
    mapping(string => DonationRecord) private _donations;
    mapping(bytes32 => mapping(bytes32 => UtilizationReport)) private _reports; // campaignId => reportHash => Report
    mapping(bytes32 => bytes32[]) private _campaignReportHashes;
    mapping(bytes32 => string[]) private _campaignDonationRefs;

    // Events
    event CampaignRegistered(
        bytes32 indexed campaignId,
        address indexed ngoWallet,
        uint256 targetAmount,
        string metadataUri,
        uint256 timestamp
    );

    event CampaignStatusUpdated(
        bytes32 indexed campaignId,
        CampaignStatus oldStatus,
        CampaignStatus newStatus,
        uint256 timestamp
    );

    event DonationRecorded(
        string indexed donationRef,
        bytes32 indexed campaignId,
        address indexed donorAddress,
        uint256 amount,
        string currency,
        bool isNativeCrypto,
        uint256 timestamp
    );

    event UtilizationReportAnchored(
        bytes32 indexed campaignId,
        bytes32 indexed reportHash,
        address indexed submitter,
        uint256 amountSpent,
        string category,
        string metadataUri,
        uint256 timestamp
    );

    constructor(address defaultAdmin, address registrar) {
        require(defaultAdmin != address(0), "Admin address cannot be zero");
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);

        if (registrar != address(0)) {
            _grantRole(REGISTRAR_ROLE, registrar);
        } else {
            _grantRole(REGISTRAR_ROLE, defaultAdmin);
        }
    }

    // --- CAMPAIGN MANAGEMENT ---

    /**
     * @notice Registers a new verified campaign. Restricted to DEFAULT_ADMIN_ROLE or REGISTRAR_ROLE.
     */
    function registerCampaign(
        bytes32 campaignId,
        address payable ngoWallet,
        uint256 targetAmount,
        string calldata metadataUri
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(campaignId != bytes32(0), "Invalid campaign ID");
        require(ngoWallet != address(0), "Invalid NGO wallet address");
        require(!_campaigns[campaignId].exists, "Campaign already registered");
        require(targetAmount > 0, "Target amount must be > 0");

        _campaigns[campaignId] = Campaign({
            campaignId: campaignId,
            ngoWallet: ngoWallet,
            targetAmount: targetAmount,
            totalRaised: 0,
            donationCount: 0,
            status: CampaignStatus.Active,
            metadataUri: metadataUri,
            createdAt: block.timestamp,
            exists: true
        });

        // Grant NGO role to the wallet if not already granted
        if (!hasRole(NGO_ROLE, ngoWallet)) {
            _grantRole(NGO_ROLE, ngoWallet);
        }

        emit CampaignRegistered(campaignId, ngoWallet, targetAmount, metadataUri, block.timestamp);
    }

    /**
     * @notice Updates campaign status (Active, Paused, Completed, Cancelled).
     */
    function updateCampaignStatus(
        bytes32 campaignId,
        CampaignStatus newStatus
    ) external onlyRole(REGISTRAR_ROLE) {
        require(_campaigns[campaignId].exists, "Campaign does not exist");
        CampaignStatus oldStatus = _campaigns[campaignId].status;
        require(oldStatus != newStatus, "Status already set");

        _campaigns[campaignId].status = newStatus;
        emit CampaignStatusUpdated(campaignId, oldStatus, newStatus, block.timestamp);
    }

    // --- DONATION RECORDING ---

    /**
     * @notice Allows donors to send native crypto (ETH) directly to a campaign via smart contract.
     * Funds are securely forwarded directly to the NGO wallet.
     */
    function recordNativeDonation(
        bytes32 campaignId,
        string calldata donationRef
    ) external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Donation amount must be > 0");
        require(bytes(donationRef).length > 0, "Donation reference required");
        require(!_donations[donationRef].exists, "Donation reference already recorded");

        Campaign storage campaign = _campaigns[campaignId];
        require(campaign.exists, "Campaign does not exist");
        require(campaign.status == CampaignStatus.Active, "Campaign is not active");

        // Forward native funds immediately to verified NGO wallet (Checks-Effects-Interactions)
        campaign.totalRaised += msg.value;
        campaign.donationCount += 1;

        _donations[donationRef] = DonationRecord({
            donationRef: donationRef,
            campaignId: campaignId,
            donorAddress: msg.sender,
            amount: msg.value,
            currency: "ETH",
            isNativeCrypto: true,
            timestamp: block.timestamp,
            exists: true
        });

        _campaignDonationRefs[campaignId].push(donationRef);

        (bool success, ) = campaign.ngoWallet.call{value: msg.value}("");
        require(success, "Failed to forward funds to NGO wallet");

        emit DonationRecorded(
            donationRef,
            campaignId,
            msg.sender,
            msg.value,
            "ETH",
            true,
            block.timestamp
        );
    }

    /**
     * @notice Records an off-chain verified payment (e.g., Stripe, UPI, card, or sandbox)
     * after verification by the platform backend registrar.
     */
    function recordReconciledDonation(
        bytes32 campaignId,
        string calldata donationRef,
        address donorAddress,
        uint256 amount,
        string calldata currency
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused {
        require(bytes(donationRef).length > 0, "Donation reference required");
        require(amount > 0, "Amount must be > 0");
        require(!_donations[donationRef].exists, "Donation reference already recorded");

        Campaign storage campaign = _campaigns[campaignId];
        require(campaign.exists, "Campaign does not exist");
        require(
            campaign.status == CampaignStatus.Active || campaign.status == CampaignStatus.Completed,
            "Campaign is closed"
        );

        campaign.totalRaised += amount;
        campaign.donationCount += 1;

        _donations[donationRef] = DonationRecord({
            donationRef: donationRef,
            campaignId: campaignId,
            donorAddress: donorAddress,
            amount: amount,
            currency: currency,
            isNativeCrypto: false,
            timestamp: block.timestamp,
            exists: true
        });

        _campaignDonationRefs[campaignId].push(donationRef);

        emit DonationRecorded(
            donationRef,
            campaignId,
            donorAddress,
            amount,
            currency,
            false,
            block.timestamp
        );
    }

    // --- TRANSPARENT UTILIZATION REPORTS ---

    /**
     * @notice Anchors a cryptographic SHA-256 hash of an NGO fund utilization report / procurement invoice.
     * Prevents retroactive tampering of expenditure claims.
     */
    function anchorUtilizationReport(
        bytes32 campaignId,
        bytes32 reportHash,
        uint256 amountSpent,
        string calldata category,
        string calldata metadataUri
    ) external whenNotPaused {
        require(_campaigns[campaignId].exists, "Campaign does not exist");
        require(reportHash != bytes32(0), "Invalid report hash");
        require(
            hasRole(REGISTRAR_ROLE, msg.sender) ||
            (hasRole(NGO_ROLE, msg.sender) && _campaigns[campaignId].ngoWallet == msg.sender),
            "Caller not authorized to report for this campaign"
        );
        require(!_reports[campaignId][reportHash].exists, "Report hash already anchored");

        _reports[campaignId][reportHash] = UtilizationReport({
            campaignId: campaignId,
            reportHash: reportHash,
            submitter: msg.sender,
            amountSpent: amountSpent,
            category: category,
            metadataUri: metadataUri,
            anchoredAt: block.timestamp,
            exists: true
        });

        _campaignReportHashes[campaignId].push(reportHash);

        emit UtilizationReportAnchored(
            campaignId,
            reportHash,
            msg.sender,
            amountSpent,
            category,
            metadataUri,
            block.timestamp
        );
    }

    // --- READ / VERIFICATION METHODS ---

    /**
     * @notice Read-only check for donation record existence.
     */
    function isDonationRecorded(string calldata donationRef) external view returns (bool) {
        return _donations[donationRef].exists;
    }

    /**
     * @notice Returns public donation details for transparency verification.
     */
    function getDonationRecord(string calldata donationRef) external view returns (
        bytes32 campaignId,
        address donorAddress,
        uint256 amount,
        string memory currency,
        bool isNativeCrypto,
        uint256 timestamp,
        bool exists
    ) {
        DonationRecord memory d = _donations[donationRef];
        return (
            d.campaignId,
            d.donorAddress,
            d.amount,
            d.currency,
            d.isNativeCrypto,
            d.timestamp,
            d.exists
        );
    }

    /**
     * @notice Retrieves verified campaign information.
     */
    function getCampaign(bytes32 campaignId) external view returns (
        address ngoWallet,
        uint256 targetAmount,
        uint256 totalRaised,
        uint256 donationCount,
        CampaignStatus status,
        string memory metadataUri,
        uint256 createdAt,
        bool exists
    ) {
        Campaign memory c = _campaigns[campaignId];
        return (
            c.ngoWallet,
            c.targetAmount,
            c.totalRaised,
            c.donationCount,
            c.status,
            c.metadataUri,
            c.createdAt,
            c.exists
        );
    }

    /**
     * @notice Verifies if a specific report digest has been anchored and returns details.
     */
    function verifyReport(bytes32 campaignId, bytes32 reportHash) external view returns (
        address submitter,
        uint256 amountSpent,
        string memory category,
        string memory metadataUri,
        uint256 anchoredAt,
        bool exists
    ) {
        UtilizationReport memory r = _reports[campaignId][reportHash];
        return (
            r.submitter,
            r.amountSpent,
            r.category,
            r.metadataUri,
            r.anchoredAt,
            r.exists
        );
    }

    /**
     * @notice Returns all anchored report hashes for a campaign.
     */
    function getCampaignReportHashes(bytes32 campaignId) external view returns (bytes32[] memory) {
        return _campaignReportHashes[campaignId];
    }

    /**
     * @notice Returns campaign donation references.
     */
    function getCampaignDonationRefs(bytes32 campaignId) external view returns (string[] memory) {
        return _campaignDonationRefs[campaignId];
    }

    // --- EMERGENCY & ADMIN CONTROLS ---

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
