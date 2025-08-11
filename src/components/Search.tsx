"use client";

import React, { useEffect, useState } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown } from "lucide-react";

interface SearchBoxProps {
  onSelectResult: (type: "tinh" | "xa", name: string) => void;
}

export default function SearchBox({ onSelectResult }: SearchBoxProps) {
  const [provinceNames, setProvinceNames] = useState<string[]>([]);
  const [communeNames, setCommuneNames] = useState<string[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    async function fetchNames() {
      try {
        const [provinceRes, communeRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/infocommune/all_province_names"),
          fetch("http://127.0.0.1:5000/api/infocommune/all_commune_names"),
        ]);
        const provinces = await provinceRes.json();
        const communes = await communeRes.json();
        setProvinceNames(provinces);
        setCommuneNames(communes);
      } catch (error) {
        console.error("Lỗi load tên tỉnh/xã:", error);
      }
    }
    fetchNames();
  }, []);

  const filteredProvinces = provinceNames.filter((name) =>
    name.toLowerCase().includes(value.toLowerCase())
  );
  const filteredCommunes = communeNames.filter((name) =>
    name.toLowerCase().includes(value.toLowerCase())
  );

  const maxItems = 10;

  return (
    <Command className="w-80">
      <div className="flex items-center justify-between px-3">
        <CommandInput
          placeholder="Tìm tỉnh hoặc xã..."
          autoComplete="off"
          value={value}
          onValueChange={(val) => setValue(val)}
        />
        <ChevronsUpDown className="mr-2 h-4 w-4 opacity-50" />
      </div>

      <CommandList>

        {value !== "" && (
          <>
            {filteredProvinces.length > 0 && (
              <CommandGroup heading="Tỉnh/Thành phố">
                {filteredProvinces.slice(0, maxItems).map((name) => (
                  <CommandItem
                    key={"tinh-" + name}
                    value={name}
                    onSelect={() => {
                      onSelectResult("tinh", name);
                      setValue(name);
                    }}
                  >
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredCommunes.length > 0 && (
              <CommandGroup heading="Phường/Xã">
                {filteredCommunes.slice(0, maxItems).map((name) => (
                  <CommandItem
                    key={"xa-" + name}
                    value={name}
                    onSelect={() => {
                      onSelectResult("xa", name);
                      setValue(name);
                    }}
                  >
                    {name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredProvinces.length === 0 && filteredCommunes.length === 0 && (
              <CommandEmpty>Không tìm thấy kết quả</CommandEmpty>
            )}
          </>
        )}
      </CommandList>
    </Command>
  );
}
