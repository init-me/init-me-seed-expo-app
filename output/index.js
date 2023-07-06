"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yyl_replacer_1 = __importDefault(require("yyl-replacer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const yyl_os_1 = __importDefault(require("yyl-os"));
const lang = {
    QUEATION_SELECT_TYPE: '请选择构建方式',
    QUESTION_NAME: '项目名称',
    QUESTION_COMPONENT_NAME: '组件文件夹名称',
    TYPE_ERROR: 'env.type 不存在',
    FORMAT_FILE_START: '正在格式化文件',
    FORMAT_FILE_FINISHED: '格式化文件 完成',
    NPM_INSTALL_START: '正在安装依赖',
    NPM_INSTALL_FINISHED: '安装依赖 完成',
    PRETTIER_START: '正在格式化代码',
    PRETTIER_FINISHED: '格式化完成',
    BUILD_START: '开始首次构建',
    BUILD_FINISHED: '构建完成'
};
let initData = {
    name: '',
    type: ''
};
const SEED_PATH = path_1.default.join(__dirname, '../seeds');
const seed = {
    path: '../seeds',
    hooks: {
        /**
         * seed 包执行前 hooks
         * 可以通过 inquirer 配置成多个 seed 包
         * @param  op.targetPath: string 复制目标路径 cwd
         * @param  op.env       : {[argv: string]: string} cmd 参数
         * @return Promise<any>
         * beforeStart({env, targetPath})
         */
        beforeStart({ env, targetPath }) {
            return __awaiter(this, void 0, void 0, function* () {
                const questions = [];
                // + name
                if (env && env.name) {
                    initData.name = env.name;
                }
                else {
                    questions.push({
                        type: 'input',
                        name: 'name',
                        default: `${targetPath.split(/[\\/]/).pop()}`,
                        message: `${lang.QUESTION_NAME}:`
                    });
                }
                // - name
                // + type
                const types = fs_1.default.readdirSync(SEED_PATH).filter((iPath) => {
                    return !/^\./.test(iPath);
                });
                console.log('=== type', types);
                if (types.length === 1) {
                    initData.type = types[0];
                }
                else {
                    if (env && env.type) {
                        if (types.indexOf(env.type) !== -1) {
                            initData.type = env.type;
                        }
                        else {
                            throw new Error(`${lang.TYPE_ERROR}: ${env.type}`);
                        }
                    }
                    else {
                        questions.push({
                            type: 'list',
                            name: 'type',
                            message: `${lang.QUEATION_SELECT_TYPE}:`,
                            default: types[0],
                            choices: types
                        });
                    }
                }
                // - type
                console.log('=== seed.path', seed.path);
                seed.path = path_1.default.join(SEED_PATH, initData.type);
            });
        },
        /**
         * 复制操作前 hooks
         * 可以在此执行重命名，调整模板路径操作
         * @param  op.fileMap   : {[oriPath: string]: string[]} 复制操作映射表
         * @param  op.targetPath: string 复制目标路径 cwd
         * @param  op.env       : {[argv: string]: string} cmd 参数
         * @return Promise<fileMap>
         * beforeCopy({fileMap, targetPath})
         */
        beforeCopy({ fileMap, targetPath }) {
            fileMap[path_1.default.join(seed.path, 'gitignore')] = [path_1.default.join(targetPath, '.gitignore')];
            fileMap[path_1.default.join(seed.path, 'npmignore')] = [path_1.default.join(targetPath, '.npmignore')];
            return Promise.resolve(fileMap);
        },
        /**
         * 复制操作后 hooks
         * 可以在在此执行 项目初始化如 npm install 操作
         * @param  op.fileMap   : {[oriPath: string]: string[]} 复制操作映射表
         * @param  op.targetPath: string 复制目标路径 cwd
         * @param  op.env       : {[argv: string]: string} cmd 参数
         * @return Promise<any>
         * afterCopy({fileMap, targetPath, env })
         */
        afterCopy({ targetPath, env, logger }) {
            return __awaiter(this, void 0, void 0, function* () {
                // + format
                logger.log('info', [lang.FORMAT_FILE_START]);
                const rPaths = [
                    path_1.default.join(targetPath, 'package.json'),
                    path_1.default.join(targetPath, 'README.md'),
                    path_1.default.join(targetPath, 'app.json'),
                ];
                rPaths.forEach((iPath) => {
                    const cnt = fs_1.default.readFileSync(iPath).toString();
                    fs_1.default.writeFileSync(iPath, yyl_replacer_1.default.dataRender(cnt, initData));
                    logger.log('update', [iPath]);
                });
                yield new Promise((resolve) => {
                    setTimeout(resolve);
                });
                logger.log('info', [lang.NPM_INSTALL_START]);
                logger.log('info', [lang.NPM_INSTALL_START]);
                const yarnVersion = yield yyl_os_1.default.getYarnVersion();
                if (yarnVersion) {
                    yield yyl_os_1.default.runCMD('yarn install', targetPath);
                }
                else {
                    yield yyl_os_1.default.runCMD('npm install', targetPath);
                }
                logger.log('success', [lang.NPM_INSTALL_FINISHED]);
                logger.log('info', [lang.PRETTIER_START]);
                if (yarnVersion) {
                    yield yyl_os_1.default.runCMD('yarn prettier', targetPath);
                }
                else {
                    yield yyl_os_1.default.runCMD('npm run prettier', targetPath);
                }
                logger.log('success', [lang.PRETTIER_FINISHED]);
                // logger.log('info', [lang.BUILD_START])
                // if (yarnVersion) {
                //   await extOs.runCMD('yarn start', targetPath)
                // } else {
                //   await extOs.runCMD('npm run start', targetPath)
                // }
                logger.log('success', [lang.BUILD_FINISHED]);
                // - format
            });
        }
    }
};
module.exports = seed;
