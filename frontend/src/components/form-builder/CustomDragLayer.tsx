// src/components/form-builder/CustomDragLayer.tsx
'use client';

import { useDragLayer } from 'react-dnd';
import { ItemTypes } from '@/types/dragTypes';
import { FieldType } from '@/types/form';
import {
  Type,
  User,
  Mail,
  MapPin,
  Phone,
  Calendar,
  Clock,
  PenTool,
  AlignLeft,
  ShoppingCart,
  FileText,
  AlignJustify,
  MessageSquare,
  ChevronDown,
  Circle,
  CheckSquare,
  Hash,
  Image,
  Upload,
  Clock3,
} from 'lucide-react';

export default function CustomDragLayer() {
  const { itemType, isDragging, item, initialOffset, currentOffset } =
    useDragLayer(monitor => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      initialOffset: monitor.getInitialSourceClientOffset(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    }));

  function getItemStyles() {
    if (!initialOffset || !currentOffset) {
      return { display: 'none' };
    }

    const { x, y } = currentOffset;

    // Adjust position to create a centered effect or offset from cursor
    const adjustX = x - 100; // Half the width of preview
    const adjustY = y - 20; // Offset from cursor

    const transform = `translate(${adjustX}px, ${adjustY}px)`;

    return {
      transform,
      WebkitTransform: transform,
      width: '200px',
    };
  }

  function renderIcon(fieldType: FieldType) {
    switch (fieldType) {
      case FieldType.HEADING:
        return <Type size={16} />;
      case FieldType.FULL_NAME:
        return <User size={16} />;
      case FieldType.EMAIL:
        return <Mail size={16} />;
      case FieldType.ADDRESS:
        return <MapPin size={16} />;
      case FieldType.PHONE:
        return <Phone size={16} />;
      case FieldType.DATE_PICKER:
        return <Calendar size={16} />;
      case FieldType.APPOINTMENT:
        return <Clock size={16} />;
      case FieldType.SIGNATURE:
        return <PenTool size={16} />;
      case FieldType.FILL_BLANK:
        return <AlignLeft size={16} />;
      case FieldType.PRODUCT_LIST:
        return <ShoppingCart size={16} />;

      case FieldType.SHORT_TEXT:
        return <FileText size={16} />;
      case FieldType.LONG_TEXT:
        return <AlignJustify size={16} />;
      case FieldType.PARAGRAPH:
        return <MessageSquare size={16} />;
      case FieldType.DROPDOWN:
        return <ChevronDown size={16} />;
      case FieldType.SINGLE_CHOICE:
        return <Circle size={16} />;
      case FieldType.MULTIPLE_CHOICE:
        return <CheckSquare size={16} />;
      case FieldType.NUMBER:
        return <Hash size={16} />;
      case FieldType.IMAGE:
        // eslint-disable-next-line jsx-a11y/alt-text
        return <Image size={16} />;
      case FieldType.FILE_UPLOAD:
        return <Upload size={16} />;
      case FieldType.TIME:
        return <Clock3 size={16} />;
      default:
        return <Type size={16} />;
    }
  }

  function renderItem() {
    switch (itemType) {
      case ItemTypes.FORM_ELEMENT:
        return (
          <div className='bg-[#2C2F4A] p-3 rounded-md shadow-xl border border-blue-300 flex items-center text-white'>
            <div className='mr-3 bg-blue-500 rounded-full p-1.5'>
              {item.fieldType && renderIcon(item.fieldType)}
            </div>
            <span className='text-sm font-medium'>
              {item.fieldType && getFieldTypeName(item.fieldType)}
            </span>
          </div>
        );
      case ItemTypes.FORM_FIELD:
        return (
          <div className='bg-[#2C2F4A] p-3 rounded-md shadow-xl border border-blue-400 w-full'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-white'>
                Moving Field
              </span>
              <div className='bg-blue-500 rounded-full p-0.5 text-white'>
                <Clock size={14} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function getFieldTypeName(type: FieldType): string {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  if (!isDragging) {
    return null;
  }

  return (
    <div className='fixed pointer-events-none z-[9999] left-0 top-0 w-full h-full'>
      <div style={getItemStyles()}>{renderItem()}</div>
    </div>
  );
}
