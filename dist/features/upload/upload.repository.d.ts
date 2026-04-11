export type MovePendingToPermanentResult = "moved" | "already_permanent" | "unavailable";
declare class UploadRepository {
    pendingDir(): string;
    permanentDir(): string;
    ensurePendingDir(): Promise<void>;
    movePendingToPermanent(filename: string): Promise<MovePendingToPermanentResult>;
}
declare const _default: UploadRepository;
export default _default;
//# sourceMappingURL=upload.repository.d.ts.map