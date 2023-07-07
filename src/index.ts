import { InitMeSeed } from 'init-me-seed-types'
import inquirer, { QuestionCollection } from 'inquirer'
import rp from 'yyl-replacer'
import fs from 'fs'
import path from 'path'
import extOs from 'yyl-os'

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
}

let initData = {
  name: '',
  type: ''
}

const SEED_PATH = path.join(__dirname, '../seeds')

const seed: InitMeSeed.Config = {
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
    async beforeStart({ env, targetPath }) {
      const questions: QuestionCollection[] = []
      // + name
      if (env && env.name) {
        initData.name = env.name
      } else {
        questions.push({
          type: 'input',
          name: 'name',
          default: `${targetPath.split(/[\\/]/).pop()}`,
          message: `${lang.QUESTION_NAME}:`
        })
      }
      // - name

      // + type
      const types = fs.readdirSync(SEED_PATH).filter((iPath) => {
        return !/^\./.test(iPath)
      })
      if (types.length === 1) {
        initData.type = types[0]
      } else {
        if (env && env.type) {
          if (types.indexOf(env.type) !== -1) {
            initData.type = env.type
          } else {
            throw new Error(`${lang.TYPE_ERROR}: ${env.type}`)
          }
        } else {
          questions.push({
            type: 'list',
            name: 'type',
            message: `${lang.QUEATION_SELECT_TYPE}:`,
            default: types[0],
            choices: types
          })
        }
      }
      // - type

      if (questions.length) {
        const r = await inquirer.prompt(questions)
        if (r.name) {
          initData = Object.assign(initData, r)
        }
      }

      seed.path = path.join(SEED_PATH, initData.type)
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
      fileMap[path.join(seed.path, 'gitignore')] = [path.join(targetPath, '.gitignore')]
      fileMap[path.join(seed.path, 'npmignore')] = [path.join(targetPath, '.npmignore')]

      return Promise.resolve(fileMap)
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
    async afterCopy({ targetPath, env, logger }) {
      // + format
      logger.log('info', [lang.FORMAT_FILE_START])
      const rPaths = [
        path.join(targetPath, 'package.json'),
        path.join(targetPath, 'README.md'),
        path.join(targetPath, 'app.json')
      ]
      rPaths.forEach((iPath) => {
        const cnt = fs.readFileSync(iPath).toString()
        fs.writeFileSync(iPath, rp.dataRender(cnt, initData))
        logger.log('update', [iPath])
      })
      await new Promise((resolve) => {
        setTimeout(resolve)
      })
      logger.log('info', [lang.NPM_INSTALL_START])
      logger.log('info', [lang.NPM_INSTALL_START])
      const yarnVersion = await extOs.getYarnVersion()
      if (yarnVersion) {
        await extOs.runCMD('yarn install', targetPath)
      } else {
        await extOs.runCMD('npm install', targetPath)
      }
      logger.log('success', [lang.NPM_INSTALL_FINISHED])
      logger.log('info', [lang.PRETTIER_START])
      if (yarnVersion) {
        await extOs.runCMD('yarn prettier', targetPath)
      } else {
        await extOs.runCMD('npm run prettier', targetPath)
      }
      logger.log('success', [lang.PRETTIER_FINISHED])
      // logger.log('info', [lang.BUILD_START])
      // if (yarnVersion) {
      //   await extOs.runCMD('yarn start', targetPath)
      // } else {
      //   await extOs.runCMD('npm run start', targetPath)
      // }
      logger.log('success', [lang.BUILD_FINISHED])
      // - format
    }
  }
}

module.exports = seed
