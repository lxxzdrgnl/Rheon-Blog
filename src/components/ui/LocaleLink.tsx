"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useI18n } from "@/i18n/provider";
import { localizeHref } from "@/lib/locale";

type Props = Omit<ComponentProps<typeof NextLink>, "href"> & { href: string };

export function LocaleLink({ href, ...rest }: Props) {
  const { locale } = useI18n();
  return <NextLink href={localizeHref(href, locale)} {...rest} />;
}
