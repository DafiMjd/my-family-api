"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const person_routes_1 = __importDefault(require("@/features/persons/person.routes"));
const marriage_routes_1 = __importDefault(require("@/features/marriage/marriage.routes"));
const family_routes_1 = __importDefault(require("@/features/family/family.routes"));
const family_tree_routes_1 = __importDefault(require("@/features/family-tree/family-tree.routes"));
const auth_routes_1 = __importDefault(require("@/features/auth/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/person', person_routes_1.default);
app.use('/api/marriage', marriage_routes_1.default);
app.use('/api/family', family_routes_1.default);
app.use('/api/family-tree', family_tree_routes_1.default);
app.use('/api/auth', auth_routes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Family API is running',
        timestamp: new Date().toISOString()
    });
});
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`
    });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`👤 Person API: http://localhost:${PORT}/api/person`);
    console.log(`💍 Marriage API: http://localhost:${PORT}/api/marriage`);
    console.log(`👨‍👩‍👧‍👦 Family API: http://localhost:${PORT}/api/family`);
    console.log(`🌳 Family Tree API: http://localhost:${PORT}/api/family-tree`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
});
exports.default = app;
//# sourceMappingURL=app.js.map