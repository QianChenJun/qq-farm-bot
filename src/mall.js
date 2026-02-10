/**
 * 商场模块
 * 负责商场商品购买，包括免费礼包、化肥等
 */

const { sendMsgAsync } = require('./network');
const { types } = require('./proto');
const { log, logWarn } = require('./utils');

let mallCache = null;  // 商场列表缓存
let lastFetchTime = 0;  // 上次获取时间

/**
 * 获取商场列表
 * @param {number} slotType - 商场类型（1=普通商场）
 * @returns {Promise<Array>} 商品列表
 */
async function getMallList(slotType = 1) {
  // 缓存5分钟
  const now = Date.now();
  if (mallCache && now - lastFetchTime < 5 * 60 * 1000) {
    return mallCache;
  }

  const body = types.GetMallListBySlotTypeRequest.encode(
    types.GetMallListBySlotTypeRequest.create({ slot_type: slotType })
  ).finish();

  const { body: replyBody } = await sendMsgAsync('gamepb.mallpb.MallService', 'GetMallListBySlotType', body);
  const response = types.GetMallListBySlotTypeResponse.decode(replyBody);

  // 解析每个商品的bytes
  const goodsList = [];
  for (const goodsBytes of response.goods_list || []) {
    try {
      const goods = types.MallGoods.decode(goodsBytes);
      goodsList.push(goods);
    } catch (e) {
      // 忽略解析失败的商品
      logWarn('商场', `解析商品失败: ${e.message}`);
    }
  }

  mallCache = goodsList;
  lastFetchTime = now;

  log('商场', `获取到 ${goodsList.length} 个商品`);

  return mallCache;
}

/**
 * 购买商品
 * @param {number} goodsId - 商品ID
 * @param {number} count - 购买数量
 * @returns {Promise<Object>} 购买结果
 */
async function purchase(goodsId, count = 1) {
  const body = types.PurchaseRequest.encode(
    types.PurchaseRequest.create({
      goods_id: goodsId,
      count: count,
    })
  ).finish();

  const { body: replyBody } = await sendMsgAsync('gamepb.mallpb.MallService', 'Purchase', body);
  const response = types.PurchaseResponse.decode(replyBody);

  return response;
}

/**
 * 购买免费礼包
 * @returns {Promise<number>} 购买成功的数量
 */
async function buyFreeGifts() {
  try {
    // 检查types是否正确加载
    if (!types.GetMallListBySlotTypeRequest) {
      logWarn('商场', 'Proto类型未加载，跳过购买');
      return 0;
    }

    const goodsList = await getMallList(1);
    let boughtCount = 0;

    for (const goods of goodsList) {
      // 查找免费商品（价格为0或is_free为true）
      const isFree = goods.price === 0 || goods.is_free === true;

      if (isFree) {
        try {
          await purchase(goods.goods_id, 1);
          log('商场', `购买成功: ${goods.name || goods.goods_id}`);
          boughtCount++;

          // 避免请求过快
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          // 忽略已购买、限购、商品不存在等正常错误
          const isNormalError = e.message && (
            e.message.includes('已购买') ||
            e.message.includes('限购') ||
            e.message.includes('库存') ||
            e.message.includes('1031001')  // 商品不存在（可能已购买）
          );
          if (!isNormalError) {
            logWarn('商场', `购买 ${goods.name || goods.goods_id} 失败: ${e.message}`);
          }
        }
      }
    }

    if (boughtCount > 0) {
      log('商场', `成功购买 ${boughtCount} 个免费礼包`);
    }

    return boughtCount;
  } catch (e) {
    logWarn('商场', `获取商场列表失败: ${e.message}`);
    return 0;
  }
}

async function buyFertilizer() {
  try {
    const goodsList = await getMallList(1);

    const fertilizerGoods = goodsList.find(goods =>
      goods.name && (
        goods.name.includes('有机化肥') ||
        goods.name.includes('有机肥')
      )
    );

    if (!fertilizerGoods) {
      logWarn('商场', '未找到高级肥料商品');
      return false;
    }

    log('商场', `找到高级肥料: ${fertilizerGoods.name} (ID: ${fertilizerGoods.goods_id})`);

    try {
      await purchase(fertilizerGoods.goods_id, 999);
      log('商场', `购买高级肥料成功`);
      return true;
    } catch (e) {
      const isNormalError = e.message && (
        e.message.includes('1000019') ||
        e.message.includes('点券不足')
      );
      if (!isNormalError) {
        logWarn('商场', `购买高级肥料失败: ${e.message}`);
      }
      return false;
    }
  } catch (e) {
    logWarn('商场', `获取商场列表失败: ${e.message}`);
    return false;
  }
}

/**
 * 清除缓存
 */
function clearCache() {
  mallCache = null;
  lastFetchTime = 0;
}

module.exports = {
  getMallList,
  purchase,
  buyFreeGifts,
  buyFertilizer,
  clearCache,
};
