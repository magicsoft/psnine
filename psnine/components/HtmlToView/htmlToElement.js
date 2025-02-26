import React from 'react';
import {
  Text,
  View,
  Dimensions,
  StyleSheet,
  Image
} from 'react-native';
import htmlparser from 'htmlparser2-without-node-native';
import entities from 'entities';

import AutoSizedImage from './resizableImage';
import InlineImage from './inlineImage';
import AutoSizedWebview from './webview';

const LINE_BREAK = '\n';
const PARAGRAPH_BREAK = '\n\n';
const BULLET = '\u2022 ';
const inlineElements = ['a', 'span', 'em', 'font', 'label', 'b', 'strong', 'i', 'small', 'img', 'u'];
const blockLevelElements = ['pre', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'blockquote']
const { width: SCEEN_WIDTH } = Dimensions.get('window')

// 安卓不允许Text中嵌套View, 只允许嵌套Text和Image, 因此将图片分为第一层的外联图片和其他层的内联图片

// 外联图片组件, 支持Loading动画
const ResizableImgComponent = props => {
  const width = Number(props.attribs['width']) || Number(props.attribs['data-width']) || 0;
  const height = Number(props.attribs['height']) || Number(props.attribs['data-height']) || 0;

  const imgStyle = {
    width,
    height,
  };
  const source = {
    uri: props.attribs.src,
    width,
    height,
    imagePaddingOffset: props.imagePaddingOffset
  };

  return (
    <AutoSizedImage
      source={source}
      style={imgStyle}
      isLoading={props.isLoading}
      alignCenter={props.alignCenter}
      modeInfo={props.modeInfo}
      linkPressHandler={props.linkPressHandler} />
  );
};

// 内联图片组件
const InlineImgComponent = props => {
  const width = Number(props.attribs['width']) || Number(props.attribs['data-width']) || 0;
  const height = Number(props.attribs['height']) || Number(props.attribs['data-height']) || 0;

  const imgStyle = {
    width,
    height,
  };
  const source = {
    uri: props.attribs.src,
    width,
    height,
    imagePaddingOffset: props.imagePaddingOffset
  };

  return (
    <Text onLongPress={props.linkPressHandler}>
       <InlineImage
         source={source}
         style={imgStyle}
         isLoading={props.isLoading}
         alignCenter={props.alignCenter}
         modeInfo={props.modeInfo}
         linkPressHandler={props.linkPressHandler} />
    </Text>
  );
};

// 显示embed和iframe内容的Modal组件
const Web = props => {
  const width = Number(props.attribs['width']) || Number(props.attribs['data-width']) || 0;
  const height = Number(props.attribs['height']) || Number(props.attribs['data-height']) || 0;

  const imgStyle = {
    width,
    height,
  };

  const value = `<html><head></head><body><${props.name} ` + Object.keys(props.attribs).map(name => `${name}="${props.attribs[name]}"`).join(' ') + '/></body></html>'

  return (
    <AutoSizedWebview
      value={value}
      style={imgStyle}
      imagePaddingOffset={props.imagePaddingOffset}
      url={props.attribs.src}
      modeInfo={props.modeInfo}
    />
  );
};

export default function htmlToElement(rawHtml, opts, done) {
  function domToElement(dom, parent, inInsideView = true, depth = 0) {
    
    // debug开关函数
    const log = () =>{}
    // const log = (text, ...args) => console.log(`第${depth}层 ${Array(depth).fill('      ').join('')}${text} ${args.join(' ')}`)
    log('是否在View内',inInsideView)
    // inInsideView为是否为第一层, 是第一层则图片外联并且支持返回View组件, 否则只支持返回Text和内联图片组件
    if (!dom) return null;


    let domLen = dom.length;
    // 缓存是否已经被内联渲染的对象数组
    let domTemp = {};

    // 获得嵌套标签的子内容, 仅支持其中第一个子组件
    let getNodeData = function (node) {
      let nodeData = null;
      if (node.children && node.children.length) {
        let nodeChild = node.children[0];
        if (nodeChild && nodeChild.data) {
          nodeData = nodeChild.data;
        } else {
          nodeData = getNodeData(nodeChild);
        }
      }
      return nodeData;
    };

    // 向parent递归查找class和style, 最终得到文字应有的样式
    let renderInlineStyle = function (parent, styleObj) {
      // p9目前只有span的嵌套, 因此暂时只处理span
      if (parent && inlineElements.includes(parent.name)) {
        const classNameArr = (parent.attribs.class || '').split(' ')
        for (const name of classNameArr) {
          switch (name) {
            case 'font12':
              styleObj.fontSize = 12;
              break;
            case 'mark':
              styleObj.backgroundColor = '#333'
              styleObj.color = '#333'
          }
        }
        const styles = (parent.attribs.style || '').split(';')
        for (const style of styles) {
          if (!style) continue
          const splited = style.split(':')
          if (splited.length !== 2) continue
          splited[0] = splited[0].replace(/\-([a-z])/, (matched) => matched[1].toUpperCase())
          if (splited[1].includes('px')) {
            splited[1] = parseInt(splited[1])
          }
          styleObj[splited[0]] = splited[1]
        }
        renderInlineStyle(parent.parent, styleObj)
      }
    }

    // 渲染可以被内联的组件
    let renderInlineNode = function (index, result = [], inInsideView = false) {
      let thisIndex = index + 1;
      if (thisIndex < domLen) {
        let nextNode = dom[thisIndex];
        if (domTemp[thisIndex] === true) {
          return result
        }

        if (inlineElements.includes(nextNode.name) || nextNode.type === 'text') {
          // 设置缓存标识
          domTemp[thisIndex] = true;
          const isNestedImage = nextNode.name === 'a' && nextNode.children && nextNode.children.length === 1 && nextNode.children[0].name === 'img'
          // console.log(isNestedImage, nextNode.name, (nextNode.children || []).length,
          //   nextNode.children && nextNode.children.length === 1 && nextNode.children[0].name
          //  ,'isNestedImage')
          if (isNestedImage) {
            log('渲染内联组件', inInsideView)
            domTemp[thisIndex] = false
            return result
          }
          result.push(
            <Text key={index}>
            { domToElement([nextNode], nextNode.parent, false, depth+1) }
            </Text>
          )
        } else if (nextNode.name === 'br') {
          // 内联的换行, 由于内联只存在文字和图片, 因此不用考虑其他标签
          domTemp[thisIndex] = true;
          result.push(<Text key={index}>{LINE_BREAK}</Text>)
        }
        if (nextNode.next && nextNode.name !== 'div') {
          const name = nextNode.next.name
          const type = nextNode.next.type
          // console.log(name , type)
          if (type === 'text' || inlineElements.includes(name) || name === 'br') {
            renderInlineNode(thisIndex, result)
          }
        }
      }

      return result;
    };

    let renderText = (node, index, parent, shouldRenderInline = false) => {
      if (node.type == 'text' && node.data.trim() !== '') {
        let linkPressHandler = null;
        if (parent && parent.name === 'a' && parent.attribs && parent.attribs.href) {
          linkPressHandler = () => opts.linkHandler(entities.decodeHTML(parent.attribs.href))
        }

        const classStyle = {}
        renderInlineStyle(parent, classStyle)

        let inlineArr = renderInlineNode(index)

        return (
          <Text key={index} onPress={linkPressHandler} style={[
            { color: opts.modeInfo.standardTextColor },
            parent ? opts.styles[parent.name] : null,
            classStyle
          ]}>{parent && parent.name === 'pre' ? LINE_BREAK : null}
            {parent && parent.name === "li" ? BULLET : null}
            {parent && parent.name === 'br' ? LINE_BREAK : null}
            {parent && parent.name === 'p' && index < parent.length - 1 ? PARAGRAPH_BREAK : null}
            {parent && parent.name === 'h1' || parent && parent.name === 'h2' || parent && parent.name === 'h3'
              || parent && parent.name === 'h4' || parent && parent.name === 'h5' ? PARAGRAPH_BREAK : null}

            {entities.decodeHTML(node.data)}

            {inlineArr}

          </Text>
        )
      } 
      return null
    }

    return dom.map((node, index, list) => {

      if (domTemp[index] === true) {
        return;
      }

      if (opts.customRenderer) {
        const rendered = opts.customRenderer(node, index, list, parent, domToElement);
        if (rendered || rendered === null) return rendered;
      }
      log('尝试渲染renderText',node.type, node.name, inInsideView)
      const textComponent = renderText(node, index, parent, !inInsideView)
      if (textComponent) return textComponent

      if (node.type === 'tag') {
        if (node.name === 'img') {
          let linkPressHandler = null;
          let shouldForceInlineEmotion = false
          if (parent && parent.name === 'a' && parent.attribs.href) {
            const parentHref = parent.attribs.href
            const imgSrc = node.attribs.src
            const type = imgSrc === parentHref ? 'onImageLongPress' : 'linkHandler'
            linkPressHandler = () => opts[type](entities.decodeHTML(parentHref));
          } else if (node.attribs && node.attribs.src) {
            // 内联p9的默认表情图片
            if (node.attribs.src.includes('//photo.psnine.com/face/')) {
              shouldForceInlineEmotion = true
            }
            linkPressHandler = () => opts.onImageLongPress(entities.decodeHTML(node.attribs.src));
          }

          let ImageComponent = inInsideView ? ResizableImgComponent : InlineImgComponent
          if (shouldForceInlineEmotion) {
            ImageComponent = InlineImgComponent
          }
          log('渲染Img标签', '此时是否在View中?', inInsideView, ImageComponent === ResizableImgComponent)
          return (
            <ImageComponent key={index} attribs={node.attribs}
                isLoading={opts.shouldShowLoadingIndicator}
                linkPressHandler={linkPressHandler}
                alignCenter={opts.alignCenter}
                modeInfo={opts.modeInfo}
                imagePaddingOffset={opts.imagePaddingOffset} />
            );
        } else if (node.name === 'embed' || node.name === 'iframe') {
          if (inInsideView) {
            return (
              <Web key={index} attribs={node.attribs} imagePaddingOffset={opts.imagePaddingOffset} modeInfo={opts.modeInfo} name={node.name} />
            )
          } else {
            return (
              <Text style={{
                color: opts.modeInfo.accentColor,
                textDecorationLine: 'underline'
                }} onPress={() => opts.linkHandler(entities.decodeHTML(node.attribs.src))}>
                打开网页
              </Text>
            )
          }
        }

        let linkPressHandler = null;
        if (node.name === 'a' && node.attribs && node.attribs.href) {
          linkPressHandler = () => opts.linkHandler(entities.decodeHTML(node.attribs.href));
        }


        let linebreakBefore = null;
        let linebreakAfter = null;
        if (blockLevelElements.includes(node.name)) {
          switch (node.name) {
            case 'blockquote':
            case 'pre':
              linebreakBefore = LINE_BREAK;
              break;
            case 'p':
              if (index < list.length - 1) {
                linebreakAfter = PARAGRAPH_BREAK;
              }
              break;
            case 'br':
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
              linebreakAfter = LINE_BREAK;
              break;
          }
        }

        let listItemPrefix = null;
        if (node.name == 'li') {
          if (parent.name == 'ol') {
            listItemPrefix = `${index + 1}. `;
          } else if (parent.name == 'ul') {
            listItemPrefix = BULLET;
          }
        }

        let shouldSetLineAfter = false


        const classStyle = {}
        if (node.name === 'div') {
          if (node.attribs.align === 'center') {
            classStyle.alignItems = 'center'
            classStyle.justifyContent = 'center'
            classStyle.flex = 1
          }
          if (node.attribs.class) {
            const classNameArr = node.attribs.class.split(' ')
            for (const name of classNameArr) {
              switch (name) {
                case 'ml64':
                  classStyle.paddingLeft = 10
                  classStyle.flex = 5
                  classStyle.flexWrap = 'wrap'
                case 'pd10':
                  classStyle.padding = 8;
                  break;
                case 't4':
                case 't3':
                case 't2':
                case 't1':
                  classStyle.maxWidth = SCEEN_WIDTH - opts.imagePaddingOffset
                  classStyle.flexDirection = 'row'
                  classStyle.justifyContent = 'center'
                  classStyle.alignItems = 'center'
                  classStyle.elevation = 1
                  classStyle.marginTop = 2
                  classStyle.marginBottom = 2
                  classStyle.backgroundColor = opts.modeInfo.backgroundColor
                  break;
              }
            }
          }
        } else if (inlineElements.includes(node.name) === false) {
          switch (node.name) {
            case 'table':
              classStyle.backgroundColor = opts.modeInfo.brighterLevelOne
              break;
            case 'tr':
              classStyle.flexDirection =  'row'
              classStyle.flexWrap =  'wrap'
              classStyle.justifyContent = 'space-between'
              classStyle.alignItems =  'stretch'
              break;
            case 'td':
              classStyle.flex = index === 1 ? 2 : 1
              classStyle.padding = 2
              classStyle.borderBottomWidth = classStyle.borderRightWidth = 1
              classStyle.borderBottomColor = classStyle.borderRightColor = opts.modeInfo.backgroundColor
              break;
            default:
              // console.log(node.name, node.children.length)
              break;
          }
        }

        const flattenStyles = StyleSheet.flatten([
          parent ? opts.styles[parent.name] : null,
          classStyle
        ])

        const isNestedImage = inInsideView && node.name === 'a' && node.children && node.children.length !==0 && node.children.some(item => item.name === 'img')
        log('判断是渲染View还是渲染Text',inInsideView, node.name === 'a' && node.children && node.children.length === 1 && node.children[0].name === 'img',
          node.name === 'a' && node.children && node.children.length !==0 && node.children.some(item => item.name === 'img')
        , 'wow', depth)

        if (inInsideView && (inlineElements.includes(node.name) === false || isNestedImage)) {

          if (node.name === 'br') {
            // P9内容的换行规则
            if (node.prev && ['br'].includes(node.prev.name)) {
              shouldSetLineAfter = true
            }
          }

          if (flattenStyles.fontSize) delete flattenStyles.fontSize
          if (flattenStyles.fontFamily) delete flattenStyles.fontFamily
          if (flattenStyles.fontWeight) delete flattenStyles.fontWeight
          if (node.children && node.children.length === 0) {
            if (node.prev && inlineElements.includes(node.prev.name)) {
              return
            }
            return <Text key={index}>{'\n'}</Text>
          }
          log('渲染View组件', node.name, isNestedImage, depth)
          return (
            <View key={index} style={flattenStyles}>
              {domToElement(node.children, node, inInsideView, depth+1)}
              {shouldSetLineAfter && linebreakAfter && <Text key={index} onPress={linkPressHandler} style={parent ? opts.styles[parent.name] : null}>{linebreakAfter}</Text>}
            </View>
          )
        } else {
          log('渲染Text组件', inInsideView, node.name, depth)
          let inlineNode = renderInlineNode(index, [], inInsideView)

          return (
            <Text key={index} style={flattenStyles}>{domToElement(node.children, node, false, depth+1)}
              {inlineNode.length !== 0 && inlineNode}
            </Text>
          )
        }
      }
    });
  }

  const handler = new htmlparser.DomHandler(function (err, dom) {
    if (err) done(err);
    done(null, domToElement(dom, null, !opts.shouldForceInline));
  });
  const parser = new htmlparser.Parser(handler);
  parser.write(rawHtml);
  parser.done();
}