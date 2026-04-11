declare class UploadPromotionService {
    promoteProfilePictureUrlIfPending(url: string | null | undefined): Promise<string | null | undefined>;
    syncPersonProfilePictureUrl(personId: string, url: string | null): Promise<void>;
}
declare const _default: UploadPromotionService;
export default _default;
//# sourceMappingURL=upload-promotion.service.d.ts.map