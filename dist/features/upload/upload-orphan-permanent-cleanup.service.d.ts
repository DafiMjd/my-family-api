export type OrphanPermanentCleanupOptions = {
    dryRun: boolean;
    minAgeMs?: number;
};
export type OrphanPermanentCleanupResult = {
    dryRun: boolean;
    permanentDir: string;
    referencedCount: number;
    filesOnDisk: number;
    orphansFound: string[];
    deleted: string[];
    skippedTooNew: string[];
    minAgeMs: number | null;
};
declare class UploadOrphanPermanentCleanupService {
    run(options: OrphanPermanentCleanupOptions): Promise<OrphanPermanentCleanupResult>;
}
declare const _default: UploadOrphanPermanentCleanupService;
export default _default;
//# sourceMappingURL=upload-orphan-permanent-cleanup.service.d.ts.map