import fetch from "node-fetch";

const apiKey = "pFG7FfWnbMs5H9HdZQWDYmVG8utnxSDx";
const year = "2025";

/**
 * Fetch bill data from NY Senate API
 */
async function getBillData(billId) {
    const url = `https://legislation.nysenate.gov/api/3/bills/${year}/${billId}?key=${apiKey}`;
    const raw = await fetch(url).then(r => r.json());
    let bill = raw.result;

    // ------------------------------
    // Latest amendment version
    // ------------------------------
    const amendmentItems = bill?.amendments?.items || {};
    const amendmentKeys = Object.keys(amendmentItems);
    const latestVersionKey = amendmentKeys.length ? amendmentKeys[amendmentKeys.length - 1] : "";
    const latestAmendment = amendmentItems[latestVersionKey] || null;

    // Build latest print number
    const basePrintNo = bill.basePrintNo;
    const latestPrintNo = latestVersionKey ? basePrintNo + latestVersionKey : basePrintNo;

    // Sponsor short name
    const sponsorName =
        bill?.sponsor?.member?.shortName ?? null;

    // Label for output
    const billName = `${latestPrintNo} (${sponsorName})`;

    // Co-sponsors
    const coList = latestAmendment?.coSponsors?.items || [];
    const cosponsors = coList.length
        ? coList.map(c => c.fullName).join(", ")
        : null;

    const cosponsorCount = coList.length;

    // ------------------------------
    // Substituted bill override
    // ------------------------------
    if (bill.substitutedBy) {
        const newUrl = `https://legislation.nysenate.gov/api/3/bills/${year}/${bill.substitutedBy.basePrintNo}?key=${apiKey}`;
        const newRaw = await fetch(newUrl).then(r => r.json());
        bill = newRaw.result;
    }

    // ------------------------------
    // Milestone logic: PASSED?
    // ------------------------------
    const milestones = bill?.milestones?.items || [];
    const passedMilestones = milestones.filter(m => m.statusType?.includes("PASSED"));
    
    const passedStatus = passedMilestones.length
        ? `Passed ${bill.billType.desc}`
        : null;

    // ------------------------------
    // Friendly status text
    // ------------------------------
    const status = passedStatus ??
        (
            bill.status.statusType?.includes("COMM") && bill.status.committeeName
                ? `In ${bill.status.committeeName} Committee`
                : bill.status.statusDesc
        );

    // ------------------------------
    // Last Action
    // ------------------------------
    const actions = bill?.actions?.items || [];
    const lastAction = actions.length ? actions[actions.length - 1] : null;

    const lastActionText = lastAction?.text ?? null;
    const lastActionDate = lastAction?.date ?? null;

    const lastActionCombined =
        lastActionText && lastActionDate
            ? `${lastActionText} (${lastActionDate})`
            : lastActionText;

    // ------------------------------
    // Final Output Object
    // ------------------------------
    return {
        Sponsor: sponsorName,
        LatestPrintNo: latestPrintNo,
        BillName: billName,
        Cosponsors: cosponsors,
        CosponsorCount: cosponsorCount,
        Status: status,
        LastAction: lastActionCombined
    };
}

// ----------------------------------
// Example Usage
// ----------------------------------
(async () => {
    const result = await getBillData("A100");
    console.log(result);
})();
